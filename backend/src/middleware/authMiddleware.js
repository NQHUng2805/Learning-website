import jwt from 'jsonwebtoken';
import { Unauthorized } from '../core/error.response.js';

export const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

export const isAdmin = async (req, res, next) => {
    if (req.user.role !== 'admin') {
        return new Unauthorized({ message: 'You are not authorized', req }).send(res);
    } 
    next();
}
export const isTeacher = async (req, res, next) => {
    if (req.user.role === 'admin' || req.user.role === 'teacher') {
        next();
    } else {
        return new Unauthorized({ message: 'You need to be a teacher to do this!', req }).send(res);
    }
};
export default { authenticateToken, isAdmin, isTeacher };
