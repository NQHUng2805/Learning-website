import React, { useState, useEffect } from 'react';
import { Create, SimpleForm, TextInput, NumberInput, BooleanInput, DateTimeInput, ReferenceInput, SelectInput, ReferenceArrayInput, SelectArrayInput, AutocompleteArrayInput, required, useDataProvider, useNotify, useRedirect } from 'react-admin';
import axios from 'axios';

const ExamCreate = () => {
    const [students, setStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const notify = useNotify();
    const redirect = useRedirect();
    const dataProvider = useDataProvider();

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/students`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    },
                    withCredentials: true
                });
                setStudents(response.data.items || []);
            } catch (error) {
                console.error('Error fetching students:', error);
            }
        };
        fetchStudents();
    }, []);

    const handleStudentToggle = (studentId) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleSubmit = async (data) => {
        try {
            // Create exam first
            const examResponse = await dataProvider.create('exam', { data });
            const examId = examResponse.data.id || examResponse.data._id;

            // Assign students if any selected
            if (selectedStudents.length > 0 && examId) {
                try {
                    await axios.post(
                        `${import.meta.env.VITE_API_URL}/api/exams/${examId}/assign`,
                        { studentIds: selectedStudents },
                        {
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                            },
                            withCredentials: true
                        }
                    );
                    notify(`Exam created and assigned to ${selectedStudents.length} student(s) successfully`, { type: 'success' });
                } catch (assignError) {
                    console.error('Error assigning students:', assignError);
                    notify('Exam created but failed to assign students. You can assign them later from the edit page.', { type: 'warning' });
                }
            } else {
                notify('Exam created successfully', { type: 'success' });
            }

            redirect('list', 'exam');
            return examResponse;
        } catch (error) {
            console.error('Error creating exam:', error);
            notify(error.message || 'Error creating exam', { type: 'error' });
            throw error;
        }
    };

    return (
        <div className="w-full min-h-[calc(100vh-72px)] py-14 px-10">
            <Create>
                <SimpleForm onSubmit={handleSubmit}>
                    <TextInput source="title" validate={required()} />
                    <TextInput source="description" multiline />
                    <ReferenceInput source="course" reference="course">
                        <SelectInput optionText="courseTitle" validate={required()} />
                    </ReferenceInput>
                    <ReferenceArrayInput source="questions" reference="question" label="Questions (Search and Select)">
                        <AutocompleteArrayInput 
                            optionText="question" 
                            filterToQuery={searchText => ({ question: searchText })}
                            fullWidth
                        />
                    </ReferenceArrayInput>
                    <NumberInput source="duration" label="Duration (minutes)" validate={required()} />
                    <DateTimeInput source="startTime" />
                    <DateTimeInput source="endTime" />
                    <BooleanInput source="isProctored" defaultValue={true} />
                    
                    {/* Student Assignment Section */}
                    <div className="mt-6 p-4 border border-gray-300 rounded-lg">
                        <h3 className="text-lg font-semibold mb-3">Assign Students (Optional)</h3>
                        <div className="max-h-60 overflow-y-auto border border-gray-200 rounded p-3">
                            {students.length === 0 ? (
                                <p className="text-gray-500">No students available</p>
                            ) : (
                                <div className="space-y-2">
                                    {students.map(student => (
                                        <label key={student._id} className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedStudents.includes(student._id)}
                                                onChange={() => handleStudentToggle(student._id)}
                                                className="mr-3"
                                            />
                                            <span>
                                                <strong>{student.username}</strong> ({student.email})
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                            {selectedStudents.length} student(s) selected
                        </p>
                    </div>
                </SimpleForm>
            </Create>
        </div>
    );
};

export default ExamCreate;
