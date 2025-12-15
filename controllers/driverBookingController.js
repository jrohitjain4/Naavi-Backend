const Booking = require('../models/Booking');
const Driver = require('../models/Driver');
const mongoose = require('mongoose');

/**
 * Build a human readable customer object from populated booking
 */
const buildCustomerInfo = (user) => {
    if (!user) return null;
    const nameParts = [user.firstName, user.lastName].filter(Boolean);
    return {
        _id: user._id,
        name: nameParts.join(' ').trim() || null,
        phone: user.phone || user.mobileNumber || null,
    };
};

/**
 * POST /api/driver-bookings/:bookingId/accept
 * Driver accepts a pending booking in same zone; sets driverId and marks driver OnDuty
 */
exports.acceptBooking = async (req, res) => {
    try {
        const driverId = req.driver?._id || req.params.driverId;
        const { bookingId } = req.params;

        if (!driverId) {
            return res.status(400).json({ message: 'Driver ID is required' });
        }
        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({ message: 'Invalid booking ID' });
        }

        const driver = await Driver.findById(driverId)
            .select('zoneId zoneName status isActive availability associatedBoatId')
            .populate('associatedBoatId', 'boatType')
            .lean();
        if (!driver) {
            return res.status(404).json({ message: 'Driver not found' });
        }
        if (driver.status !== 'Approved' || !driver.isActive) {
            return res.status(403).json({ message: 'Driver not approved or inactive', status: driver.status });
        }

        if (driver.availability === 'OnDuty') {
            return res.status(400).json({ message: 'Driver is already OnDuty with another ride' });
        }

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        if (booking.status !== 'Pending') {
            return res.status(400).json({ message: 'Booking is not pending' });
        }
        if (booking.driverId) {
            return res.status(400).json({ message: 'Booking already assigned' });
        }

        // Zone match check
        const sameZone = (booking.zoneId && booking.zoneId.toString() === driver.zoneId.toString())
            || (!booking.zoneId && booking.zone && booking.zone === driver.zoneName);
        if (!sameZone) {
            return res.status(400).json({ message: 'Driver zone does not match booking zone' });
        }

        // Boat type match check (Small/Medium/Large etc.)
        const driverBoatType = driver.associatedBoatId?.boatType;
        if (!driverBoatType) {
            return res.status(400).json({ message: 'Driver has no registered boat; cannot accept rides' });
        }
        if (booking.boatType && booking.boatType !== driverBoatType) {
            return res.status(400).json({ message: 'Booking boat type does not match driver boat type' });
        }

        booking.driverId = driver._id;
        booking.status = 'Accepted';
        await booking.save();

        // Set driver OnDuty
        driver.availability = 'OnDuty';
        await driver.save();

        // Populate minimal info for response
        await booking.populate('zoneId', 'zoneId zoneName');
        res.status(200).json({
            message: 'Booking accepted',
            booking: {
                _id: booking._id,
                bookingId: booking.bookingId,
                status: booking.status,
                driverId: booking.driverId,
                zone: booking.zone,
                zoneId: booking.zoneId,
            },
            driver: {
                _id: driver._id,
                availability: driver.availability,
                zoneId: driver.zoneId,
                zoneName: driver.zoneName,
            }
        });
    } catch (error) {
        console.error('Error accepting booking:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * POST /api/driver-bookings/:bookingId/finish
 * Driver finishes an accepted ride: marks booking Completed, sets completedAt,
 * updates driver earnings & trips, and makes driver Available again.
 */
exports.finishRide = async (req, res) => {
    try {
        const driverId = req.driver?._id || req.params.driverId;
        const { bookingId } = req.params;

        if (!driverId) {
            return res.status(400).json({ message: 'Driver ID is required' });
        }
        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({ message: 'Invalid booking ID' });
        }

        const driver = await Driver.findById(driverId).select('zoneId zoneName status isActive availability totalTrips earningsMonth');
        if (!driver) {
            return res.status(404).json({ message: 'Driver not found' });
        }
        if (driver.status !== 'Approved' || !driver.isActive) {
            return res.status(403).json({ message: 'Driver not approved or inactive', status: driver.status });
        }

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Only assigned driver can finish the ride
        if (!booking.driverId || booking.driverId.toString() !== driver._id.toString()) {
            return res.status(403).json({ message: 'This booking is not assigned to the current driver' });
        }

        if (booking.status !== 'Accepted') {
            return res.status(400).json({ message: 'Only Accepted bookings can be completed' });
        }

        // Zone match safety (should already match from accept step)
        const sameZone = (booking.zoneId && booking.zoneId.toString() === driver.zoneId.toString())
            || (!booking.zoneId && booking.zone && booking.zone === driver.zoneName);
        if (!sameZone) {
            return res.status(400).json({ message: 'Driver zone does not match booking zone' });
        }

        // Calculate driver payout (80%) from stored fields
        const payableBase = booking.priceWithGst || booking.finalPrice || booking.totalPrice || 0;
        const expectedDriverPayout = booking.remainingPayment || Number((payableBase * 0.8).toFixed(2));

        // Mark booking completed
        booking.status = 'Completed';
        booking.completedAt = new Date();
        await booking.save();

        // Update driver stats and availability
        driver.totalTrips = (driver.totalTrips || 0) + 1;
        driver.earningsMonth = (driver.earningsMonth || 0) + expectedDriverPayout;
        driver.availability = 'Available';
        await driver.save();

        await booking.populate('zoneId', 'zoneId zoneName');

        res.status(200).json({
            message: 'Ride completed successfully',
            booking: {
                _id: booking._id,
                bookingId: booking.bookingId,
                status: booking.status,
                completedAt: booking.completedAt,
                driverId: booking.driverId,
                zone: booking.zone,
                zoneId: booking.zoneId,
                totalPrice: booking.totalPrice,
                priceWithGst: booking.priceWithGst,
                advancePayment: booking.advancePayment,
                remainingPayment: booking.remainingPayment,
            },
            driver: {
                _id: driver._id,
                availability: driver.availability,
                totalTrips: driver.totalTrips,
                earningsMonth: driver.earningsMonth,
                zoneId: driver.zoneId,
                zoneName: driver.zoneName,
            },
            driverPayout: expectedDriverPayout,
        });
    } catch (error) {
        console.error('Error finishing ride:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/**
 * Normalize zone details from booking + driver
 */
const buildZoneInfo = (booking, driver) => {
    if (booking.zoneId && typeof booking.zoneId === 'object') {
        return {
            _id: booking.zoneId._id,
            zoneId: booking.zoneId.zoneId,
            zoneName: booking.zoneId.zoneName,
        };
    }

    return {
        _id: driver.zoneId,
        zoneId: null,
        zoneName: booking.zone || driver.zoneName,
    };
};

/**
 * GET /api/driver-bookings/available
 * Returns pending bookings inside driver's zone with payout (80%) details
 */
exports.getAvailableBookingsForDriver = async (req, res) => {
    try {
        const driverId = req.driver?._id || req.query.driverId || req.params.driverId;

        if (!driverId) {
            return res.status(400).json({ message: 'Driver ID is required' });
        }

        // Fetch driver with zone and boat information
        const driver = await Driver.findById(driverId)
            .select('zoneId zoneName associatedBoatId status isActive availability')
            .populate('associatedBoatId', 'boatId boatType zoneId zoneName ghatName status')
            .lean();

        if (!driver) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        if (driver.status !== 'Approved' || !driver.isActive) {
            return res.status(403).json({
                message: 'Driver account is not approved or inactive',
                status: driver.status,
            });
        }

        // Driver must be Available to receive rides
        if (driver.availability === 'OnDuty') {
            return res.status(200).json({
                driver: {
                    _id: driverId,
                    zoneId: driver.zoneId,
                    zoneName: driver.zoneName,
                    boatId: driver.associatedBoatId?._id || null,
                    availability: driver.availability,
                },
                total: 0,
                bookings: [],
                message: 'Driver is OnDuty; no new rides will be offered until Available.',
            });
        }

        // Driver must have a registered boat with boatType to receive rides
        const driverBoatType = driver.associatedBoatId?.boatType;
        if (!driverBoatType) {
            return res.status(400).json({
                message: 'Driver has no registered boat; cannot receive rides',
            });
        }

        const filterMode = (req.query.mode || 'zone').toLowerCase();

        const matchQuery = {
            status: 'Pending',
            driverId: null, // Only unassigned bookings
        };

        // Boat type filter (enforce same boat type)
        matchQuery.boatType = driverBoatType;

        if (filterMode === 'boat' && driver.associatedBoatId?._id) {
            matchQuery.boatId = driver.associatedBoatId._id;
        } else if (driver.zoneId) {
            matchQuery.zoneId = driver.zoneId;
        } else if (driver.zoneName) {
            matchQuery.zone = driver.zoneName;
        }

        // Optional trip type filter for future use
        if (req.query.tripType) {
            matchQuery.tripType = req.query.tripType;
        }

        const bookings = await Booking.find(matchQuery)
            .populate('userId', 'firstName lastName phone mobileNumber')
            .populate('zoneId', 'zoneId zoneName')
            .populate('boatId', 'boatId boatType ghatName zoneName status')
            .sort({ bookingDate: 1, createdAt: 1 })
            .lean();

        const formatted = bookings.map((booking) => {
            const payableBase = booking.priceWithGst || booking.finalPrice || booking.totalPrice || 0;
            const advance = booking.advancePayment || Number((payableBase * 0.2).toFixed(2));
            const driverPayout = booking.remainingPayment || Number((payableBase * 0.8).toFixed(2));

            return {
                _id: booking._id,
                bookingId: booking.bookingId,
                bookingDate: booking.bookingDate,
                pickupPoint: booking.pickupPoint,
                tripType: booking.tripType,
                seats: booking.seats,
                boat: booking.boatId ? {
                    _id: booking.boatId._id || booking.boatId,
                    boatId: booking.boatId.boatId || null,
                    boatType: booking.boatId.boatType || booking.boatType,
                    status: booking.boatId.status || null,
                    ghatName: booking.boatId.ghatName || null,
                    zoneName: booking.boatId.zoneName || booking.zone,
                } : {
                    boatId: null,
                    boatType: booking.boatType,
                },
                zone: buildZoneInfo(booking, driver),
                customer: buildCustomerInfo(booking.userId),
                totalFareWithGst: payableBase,
                advanceCollected: advance,
                driverPayout,
                paymentMethod: booking.paymentMethod,
                status: booking.status,
                createdAt: booking.createdAt,
            };
        });

        res.status(200).json({
            driver: {
                _id: driverId,
                zoneId: driver.zoneId,
                zoneName: driver.zoneName,
                boatId: driver.associatedBoatId?._id || null,
                availability: driver.availability,
                boatType: driverBoatType,
                filterMode,
            },
            total: formatted.length,
            bookings: formatted,
        });
    } catch (error) {
        console.error('Error fetching driver zone bookings:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


