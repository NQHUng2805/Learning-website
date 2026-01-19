import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const ExamResults = ({ examId, examTitle }) => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedResult, setExpandedResult] = useState(null);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/api/exams/${examId}/results`,
                    {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                        },
                        withCredentials: true
                    }
                );

                setResults(response.data.results || []);
            } catch (error) {
                console.error('Error fetching results:', error);
                Swal.fire('Error', 'Failed to load exam results', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [examId]);

    if (loading) {
        return <div className="text-center py-8">Loading results...</div>;
    }

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-2xl font-bold mb-4">Exam Results: {examTitle}</h3>
            <p className="text-gray-600 mb-6">Total Attempts: {results.length}</p>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="border border-gray-300 p-3 text-left">Student</th>
                            <th className="border border-gray-300 p-3 text-center">Score</th>
                            <th className="border border-gray-300 p-3 text-center">Passed</th>
                            <th className="border border-gray-300 p-3 text-center">Duration</th>
                            <th className="border border-gray-300 p-3 text-center">Submitted</th>
                            <th className="border border-gray-300 p-3 text-center">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.map(result => (
                            <React.Fragment key={result._id}>
                                <tr className="hover:bg-gray-50">
                                    <td className="border border-gray-300 p-3">
                                        <div>
                                            <strong>{result.studentName}</strong>
                                            <div className="text-sm text-gray-500">{result.studentEmail}</div>
                                        </div>
                                    </td>
                                    <td className="border border-gray-300 p-3 text-center font-semibold">
                                        {result.score}%
                                    </td>
                                    <td className="border border-gray-300 p-3 text-center">
                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                            result.isPassed
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {result.isPassed ? '✓ Passed' : '✗ Failed'}
                                        </span>
                                    </td>
                                    <td className="border border-gray-300 p-3 text-center">
                                        {result.duration} min
                                    </td>
                                    <td className="border border-gray-300 p-3 text-center text-sm">
                                        {new Date(result.submittedAt).toLocaleDateString()}
                                    </td>
                                    <td className="border border-gray-300 p-3 text-center">
                                        <button
                                            onClick={() => setExpandedResult(expandedResult === result._id ? null : result._id)}
                                            className="text-blue-600 hover:text-blue-800 font-semibold"
                                        >
                                            {expandedResult === result._id ? 'Hide' : 'Show'}
                                        </button>
                                    </td>
                                </tr>

                                {expandedResult === result._id && (
                                    <tr className="bg-blue-50">
                                        <td colSpan="6" className="border border-gray-300 p-4">
                                            <div className="grid grid-cols-2 gap-6">
                                                <div>
                                                    <h4 className="font-bold text-lg mb-3">Proctoring Data</h4>
                                                    <div className="space-y-2">
                                                        <p>
                                                            <strong>Face Missing Duration:</strong>{' '}
                                                            {Math.round(result.aiLogs.faceMissingDuration / 60)}s
                                                        </p>
                                                        <p>
                                                            <strong>Suspicious Actions:</strong>{' '}
                                                            {result.aiLogs.suspiciousActions}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div>
                                                    <h4 className="font-bold text-lg mb-3">Emotion Analysis</h4>
                                                    <div className="space-y-1">
                                                        {Object.entries(result.aiLogs.emotionStats).map(([emotion, percentage]) => (
                                                            <div key={emotion} className="flex justify-between">
                                                                <span className="capitalize">{emotion}:</span>
                                                                <span className="font-semibold">{percentage}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>

                {results.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        No attempts yet
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExamResults;
