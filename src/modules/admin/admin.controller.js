import User from '../../models/User.js';
import Doctor from '../../models/Doctor.js';
import Patient from '../../models/Patient.js';
import Appointment from '../../models/Appointment.js';
import Payment from '../../models/Payment.js';
import Specialty from '../../models/Specialty.js';
import { sendResponse } from '../../utils/response.js';

// OVERVIEW
export const getOverview = async (req, res) => {
  try {
    const [totalUsers, totalDoctors, totalPatients, totalAppointments, totalPayments] = await Promise.all([
      User.countDocuments(),
      Doctor.countDocuments(),
      Patient.countDocuments(),
      Appointment.countDocuments(),
      Payment.countDocuments()
    ]);
    
    return sendResponse(res, 200, 'Overview fetched successfully', {
      totalUsers,
      totalDoctors,
      totalPatients,
      totalAppointments,
      totalPayments,
      usersGrowth: 5.2,
      doctorsGrowth: 2.1,
      patientsGrowth: 6.4,
      appointmentsGrowth: 12.5,
      paymentsGrowth: 8.3
    });
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

// SYSTEM HEALTH
export const getSystemHealth = async (req, res) => {
  try {
    return sendResponse(res, 200, 'System Health fetched successfully', {
      services: [
        { name: 'Database', status: 'Online', uptime: 99.9 },
        { name: 'API Server', status: 'Stable', uptime: 99.9 },
        { name: 'Storage', status: 'Online', uptime: 99.9 }
      ],
      databaseLoad: 12.4,
      memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      criticalAlerts: 0
    });
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

// USERS
export const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0; // 0-indexed from Angular
    const limit = parseInt(req.query.limit) || 20;
    const skip = page * limit;

    const totalElements = await User.countDocuments();
    const users = await User.find().skip(skip).limit(limit).sort({ createdAt: -1 });

    const totalPages = Math.ceil(totalElements / limit);

    return sendResponse(res, 200, 'Users fetched successfully', {
      content: users.map(u => ({
        id: u._id.toString(),
        firstName: u.fullName ? u.fullName.split(' ')[0] : 'NoName',
        lastName: u.fullName && u.fullName.split(' ').length > 1 ? u.fullName.split(' ').slice(1).join(' ') : '',
        email: u.email,
        role: u.role,
        status: u.isVerified ? 'Active' : 'Pending',
        isActive: u.isVerified,
        phone: u.phoneNumber,
        createdAt: u.createdAt,
        lastLogin: u.lastLoginAt
      })),
      totalElements,
      totalPages,
      size: limit,
      number: page,
      first: page === 0,
      last: page === totalPages - 1 || totalPages === 0,
      empty: totalElements === 0,
      pageable: { pageNumber: page, pageSize: limit }
    });
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

export const getUserById = async (req, res) => {
  try {
    const u = await User.findById(req.params.id);
    if (!u) return sendResponse(res, 404, 'User not found');
    return sendResponse(res, 200, 'User fetched successfully', {
      id: u._id.toString(),
      firstName: u.fullName ? u.fullName.split(' ')[0] : 'NoName',
      lastName: u.fullName && u.fullName.split(' ').length > 1 ? u.fullName.split(' ').slice(1).join(' ') : '',
      email: u.email,
      role: u.role,
      status: u.isVerified ? 'Active' : 'Pending',
      isActive: u.isVerified,
      phone: u.phoneNumber,
      createdAt: u.createdAt,
      lastLogin: u.lastLoginAt
    });
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

// SPECIALTIES
export const getSpecialties = async (req, res) => {
  try {
    const specialties = await Specialty.find();
    return sendResponse(res, 200, 'Specialties fetched successfully', specialties.map(s => ({
      id: s._id.toString(),
      name: s.name,
      description: s.description,
      image: s.imageUrl,
      imagePath: s.imageUrl,
      isActive: true,
      doctorsCount: 0
    })));
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

export const getSpecialtyById = async (req, res) => {
  try {
    const s = await Specialty.findById(req.params.id);
    if (!s) return sendResponse(res, 404, 'Specialty not found');
    return sendResponse(res, 200, 'Specialty fetched', {
      id: s._id.toString(),
      name: s.name,
      description: s.description,
      image: s.imageUrl,
      imagePath: s.imageUrl,
      isActive: true,
      doctorsCount: 0
    });
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

export const createSpecialty = async (req, res) => {
  try {
    const { Name, Description } = req.body;
    let imageUrl = null;
    if (req.file) {
      imageUrl = '/uploads/' + req.file.filename;
    }
    const s = await Specialty.create({ name: Name, description: Description, imageUrl });
    return sendResponse(res, 200, 'Specialty created', {
      id: s._id.toString(),
      name: s.name,
      description: s.description,
      image: s.imageUrl,
      isActive: true
    });
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

export const updateSpecialty = async (req, res) => {
  try {
    const { Name, Description } = req.body;
    const s = await Specialty.findById(req.params.id);
    if (!s) return sendResponse(res, 404, 'Not found');
    
    if (Name) s.name = Name;
    if (Description) s.description = Description;
    if (req.file) {
      s.imageUrl = '/uploads/' + req.file.filename;
    }
    await s.save();
    return sendResponse(res, 200, 'Specialty updated', {
      id: s._id.toString(),
      name: s.name,
      description: s.description,
      image: s.imageUrl,
      isActive: true
    });
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

export const deleteSpecialty = async (req, res) => {
  try {
    await Specialty.findByIdAndDelete(req.params.id);
    return sendResponse(res, 200, 'Specialty deleted', null);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

export const restoreSpecialty = async (req, res) => {
  try {
    return sendResponse(res, 200, 'Specialty restored', null);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

// LOGS
export const getLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    
    // Mock logs
    const mockLogs = [
      { id: '1', level: 'info', module: 'Auth', message: 'User logged in', createdAt: new Date().toISOString() },
      { id: '2', level: 'warning', module: 'Payment', message: 'Payment delayed', createdAt: new Date().toISOString() }
    ];
    
    return sendResponse(res, 200, 'Logs fetched', {
      items: mockLogs,
      totalCount: 2,
      page,
      pageSize,
      totalPages: 1
    });
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

// PAYMENTS
export const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find().populate('userId', 'fullName email').populate('appointmentId');
    return sendResponse(res, 200, 'Payments fetched', payments.map(p => ({
      id: p._id.toString(),
      transactionId: p.providerRef || 'TXN-' + p._id.toString().slice(-6),
      amount: p.amount,
      currency: p.currency,
      status: p.status === 'success' ? 'Completed' : (p.status === 'failed' ? 'Failed' : 'Pending'),
      paymentMethod: p.provider,
      patientName: p.userId ? p.userId.fullName : 'Unknown Patient',
      doctorName: 'Doctor', // Could populate doctor from appointment
      createdAt: p.createdAt
    })));
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

export const getPaymentsSummary = async (req, res) => {
  try {
    const payments = await Payment.find();
    const totalRevenue = payments.filter(p => p.status === 'success').reduce((acc, p) => acc + p.amount, 0);
    const pendingAmount = payments.filter(p => p.status === 'pending').reduce((acc, p) => acc + p.amount, 0);
    const totalTransactions = payments.length;
    const successRate = totalTransactions > 0 ? (payments.filter(p => p.status === 'success').length / totalTransactions) * 100 : 0;
    
    return sendResponse(res, 200, 'Payment summary fetched', {
      totalRevenue,
      monthlyRevenue: totalRevenue * 0.8, // Mock
      pendingAmount,
      totalTransactions,
      successRate: Math.round(successRate)
    });
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

export const getPaymentById = async (req, res) => {
  try {
    const p = await Payment.findById(req.params.id).populate('userId', 'fullName');
    if (!p) return sendResponse(res, 404, 'Payment not found');
    return sendResponse(res, 200, 'Payment fetched', {
      id: p._id.toString(),
      transactionId: p.providerRef || 'TXN-' + p._id.toString().slice(-6),
      amount: p.amount,
      currency: p.currency,
      status: p.status === 'success' ? 'Completed' : (p.status === 'failed' ? 'Failed' : 'Pending'),
      paymentMethod: p.provider,
      patientName: p.userId ? p.userId.fullName : 'Unknown Patient',
      doctorName: 'Doctor',
      createdAt: p.createdAt
    });
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};
