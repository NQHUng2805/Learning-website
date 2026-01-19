import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const ExamAssign = ({ examId }) => {
    const [students, setStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/students`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    },
                    withCredentials: true
                });

                const userStudents = response.data.items || [];
                setStudents(userStudents);
            } catch (error) {
                console.error('Error fetching students:', error);
                Swal.fire('Error', 'Failed to load students', 'error');
            }
        };

        fetchStudents();
    }, []);

    const handleSelectStudent = (studentId) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleAssign = async () => {
        if (selectedStudents.length === 0) {
            Swal.fire('Warning', 'Please select at least one student', 'warning');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/exams/${examId}/assign`,
                { studentIds: selectedStudents },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    },
                    withCredentials: true
                }
            );

            Swal.fire(
                'Success',
                `Exam assigned to ${response.data.notificationsSent} students and notifications sent!`,
                'success'
            );

            setSelectedStudents([]);
        } catch (error) {
            console.error('Error assigning exam:', error);
            Swal.fire('Error', error.response?.data?.message || 'Failed to assign exam', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-4">Assign Students to Exam</h3>

            <div className="mb-4 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
                {students.length === 0 ? (
                    <p className="text-gray-500">No students available</p>
                ) : (
                    <div className="space-y-2">
                        {students.map(student => (
                            <label key={student._id} className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedStudents.includes(student._id)}
                                    onChange={() => handleSelectStudent(student._id)}
                                    className="mr-3"
                                />
                                <span className="flex-1">
                                    <strong>{student.username}</strong> ({student.email})
                                </span>
                            </label>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex gap-2">
                <button
                    onClick={handleAssign}
                    disabled={loading || selectedStudents.length === 0}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded transition-colors"
                >
                    {loading ? 'Assigning...' : `Assign to ${selectedStudents.length} Student(s)`}
                </button>
            </div>
        </div>
    );
};

export default ExamAssign;
