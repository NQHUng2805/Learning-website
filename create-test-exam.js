#!/usr/bin/env node
/**
 * Test script to create a sample exam
 * Usage: node create-test-exam.js
 */

const axios = require('axios');
require('dotenv').config({ path: './backend/.env' });

const API_URL = process.env.API_URL || 'http://localhost:5000';

async function createTestExam() {
    try {
        console.log('🔍 Fetching admin user and course...\n');

        // Get a teacher/admin user
        const usersRes = await axios.get(`${API_URL}/api/users`, {
            headers: { 'Authorization': `Bearer YOUR_TOKEN_HERE` }
        });
        
        console.log('Users fetched:', usersRes.data);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Full error:', error.response?.data);
    }
}

createTestExam();
