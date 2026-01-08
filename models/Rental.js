const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema({
    billboard: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Billboard', 
        required: true 
    },
    
    // Basic Client Info
    clientName: { type: String, required: true },
    clientEmail: { type: String, required: true },
    clientPhone: { type: String },
    clientCompany: { type: String },
    
    // Detailed Client Information
    clientDetails: {
        legalName: { type: String },
        businessRegNumber: { type: String },
        physicalAddress: { type: String },
        postalAddress: { type: String },
        uniqueClientId: { type: String },
        representatives: [{
            name: { type: String },
            position: { type: String },
            phone: { type: String },
            email: { type: String }
        }]
    },
    
    // Service Description
    serviceDetails: {
        billboardLocations: { type: String },
        billboardSizes: { type: String },
        billboardTypes: { type: String },
        additionalServices: { type: String },
        artworkRequirements: { type: String },
        approvalProcess: { type: String },
        contentRestrictions: { type: String },
        expectedImpressions: { type: Number },
        visibilityReports: { type: String },
        analyticsNotes: { type: String },
        milestones: [{
            description: { type: String },
            date: { type: Date },
            completed: { type: Boolean, default: false }
        }]
    },
    
    // Payment Terms
    paymentTerms: {
        totalCost: { type: Number },
        costBreakdown: { type: String },
        paymentSchedule: { type: String },
        depositAmount: { type: Number },
        depositPaid: { type: Boolean, default: false },
        paymentMethod: { type: String },
        latePaymentPenalty: { type: String },
        taxRate: { type: Number, default: 15 },
        currency: { type: String, default: 'ZAR' },
        escalationClause: { type: String },
        invoiceNumbers: [{ type: String }],
        paymentIds: [{ type: String }]
    },
    
    // Contract Dates and Status
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    contractDuration: { type: Number, required: true },
    monthlyRate: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    contractPDF: { type: String },
    status: { 
        type: String, 
        enum: ['active', 'expired', 'upcoming', 'cancelled'],
        default: 'active'
    },
    remindersSent: [{
        type: { type: String },
        sentAt: { type: Date, default: Date.now }
    }],
    notes: { type: String }
}, { timestamps: true });

// Virtual field to calculate days remaining
rentalSchema.virtual('daysRemaining').get(function() {
    const today = new Date();
    const end = new Date(this.endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
});

// Virtual field to calculate months remaining
rentalSchema.virtual('monthsRemaining').get(function() {
    return Math.ceil(this.daysRemaining / 30);
});

// Method to get pending reminders that should be sent
rentalSchema.methods.getPendingReminders = function() {
    const daysLeft = this.daysRemaining;
    const monthsLeft = this.monthsRemaining;
    const duration = this.contractDuration; // in months
    const sentTypes = this.remindersSent.map(r => r.type);
    const pending = [];

    // Helper to check if reminder was sent
    const wasReminderSent = (type) => sentTypes.includes(type);

    // 1 MONTH CONTRACT: 1 week notification
    if (duration === 1) {
        if (daysLeft <= 7 && daysLeft > 0 && !wasReminderSent('1_week')) {
            pending.push({ type: '1_week', daysLeft });
        }
    }
    
    // 3 MONTH CONTRACT: Monthly (2 months, 1 month) + last week
    else if (duration === 3) {
        if (monthsLeft === 2 && !wasReminderSent('2_months')) {
            pending.push({ type: '2_months', daysLeft });
        }
        if (monthsLeft === 1 && !wasReminderSent('1_month')) {
            pending.push({ type: '1_month', daysLeft });
        }
        if (daysLeft <= 7 && daysLeft > 0 && !wasReminderSent('1_week')) {
            pending.push({ type: '1_week', daysLeft });
        }
    }
    
    // 6 MONTH CONTRACT: At 3 months, then follow 3-month pattern
    else if (duration === 6) {
        if (monthsLeft === 3 && !wasReminderSent('3_months')) {
            pending.push({ type: '3_months', daysLeft });
        }
        // Then follow 3-month pattern
        if (monthsLeft === 2 && !wasReminderSent('2_months')) {
            pending.push({ type: '2_months', daysLeft });
        }
        if (monthsLeft === 1 && !wasReminderSent('1_month')) {
            pending.push({ type: '1_month', daysLeft });
        }
        if (daysLeft <= 7 && daysLeft > 0 && !wasReminderSent('1_week')) {
            pending.push({ type: '1_week', daysLeft });
        }
    }
    
    // 12 MONTH (1 YEAR) CONTRACT: At 6 months, then follow 6-month pattern
    else if (duration === 12) {
        if (monthsLeft === 6 && !wasReminderSent('6_months')) {
            pending.push({ type: '6_months', daysLeft });
        }
        // Then follow 6-month pattern
        if (monthsLeft === 3 && !wasReminderSent('3_months')) {
            pending.push({ type: '3_months', daysLeft });
        }
        if (monthsLeft === 2 && !wasReminderSent('2_months')) {
            pending.push({ type: '2_months', daysLeft });
        }
        if (monthsLeft === 1 && !wasReminderSent('1_month')) {
            pending.push({ type: '1_month', daysLeft });
        }
        if (daysLeft <= 7 && daysLeft > 0 && !wasReminderSent('1_week')) {
            pending.push({ type: '1_week', daysLeft });
        }
    }
    
    // 24 MONTH (2 YEAR) CONTRACT: At 1 year (12 months), then follow 1-year pattern
    else if (duration === 24) {
        if (monthsLeft === 12 && !wasReminderSent('12_months')) {
            pending.push({ type: '12_months', daysLeft });
        }
        // Then follow 1-year pattern
        if (monthsLeft === 6 && !wasReminderSent('6_months')) {
            pending.push({ type: '6_months', daysLeft });
        }
        if (monthsLeft === 3 && !wasReminderSent('3_months')) {
            pending.push({ type: '3_months', daysLeft });
        }
        if (monthsLeft === 2 && !wasReminderSent('2_months')) {
            pending.push({ type: '2_months', daysLeft });
        }
        if (monthsLeft === 1 && !wasReminderSent('1_month')) {
            pending.push({ type: '1_month', daysLeft });
        }
        if (daysLeft <= 7 && daysLeft > 0 && !wasReminderSent('1_week')) {
            pending.push({ type: '1_week', daysLeft });
        }
    }
    
    // 60 MONTH (5 YEAR) CONTRACT: Every year (48, 36, 24, 12 months), then follow 1-year pattern
    else if (duration === 60) {
        if (monthsLeft === 48 && !wasReminderSent('48_months')) {
            pending.push({ type: '48_months', daysLeft });
        }
        if (monthsLeft === 36 && !wasReminderSent('36_months')) {
            pending.push({ type: '36_months', daysLeft });
        }
        if (monthsLeft === 24 && !wasReminderSent('24_months')) {
            pending.push({ type: '24_months', daysLeft });
        }
        if (monthsLeft === 12 && !wasReminderSent('12_months')) {
            pending.push({ type: '12_months', daysLeft });
        }
        // Then follow 1-year pattern
        if (monthsLeft === 6 && !wasReminderSent('6_months')) {
            pending.push({ type: '6_months', daysLeft });
        }
        if (monthsLeft === 3 && !wasReminderSent('3_months')) {
            pending.push({ type: '3_months', daysLeft });
        }
        if (monthsLeft === 2 && !wasReminderSent('2_months')) {
            pending.push({ type: '2_months', daysLeft });
        }
        if (monthsLeft === 1 && !wasReminderSent('1_month')) {
            pending.push({ type: '1_month', daysLeft });
        }
        if (daysLeft <= 7 && daysLeft > 0 && !wasReminderSent('1_week')) {
            pending.push({ type: '1_week', daysLeft });
        }
    }

    return pending;
};

// Method to mark a reminder as sent
rentalSchema.methods.markReminderSent = function(reminderType) {
    this.remindersSent.push({ type: reminderType });
    return this.save();
};

// Ensure virtuals are included when converting to JSON
rentalSchema.set('toJSON', { virtuals: true });
rentalSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Rental', rentalSchema);
