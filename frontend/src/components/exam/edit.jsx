import React, { useState } from 'react';
import { Edit, SimpleForm, TextInput, NumberInput, BooleanInput, DateTimeInput, ReferenceInput, SelectInput, ReferenceArrayInput, SelectArrayInput, AutocompleteArrayInput, required } from 'react-admin';
import { useParams } from 'react-router-dom';
import ExamAssign from './assign';
import ExamResults from './results';

const ExamEdit = () => {
    const { id: examId } = useParams();
    const [activeTab, setActiveTab] = useState('edit');
    const [examTitle, setExamTitle] = useState('');

    return (
        <div className="w-full min-h-[calc(100vh-72px)] py-14 px-10">
            {/* Tab Navigation */}
            <div className="mb-6 border-b border-gray-300">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('edit')}
                        className={`py-3 px-6 font-semibold transition-colors ${
                            activeTab === 'edit'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        Edit Exam
                    </button>
                    <button
                        onClick={() => setActiveTab('assign')}
                        className={`py-3 px-6 font-semibold transition-colors ${
                            activeTab === 'assign'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        Assign Students
                    </button>
                    <button
                        onClick={() => setActiveTab('results')}
                        className={`py-3 px-6 font-semibold transition-colors ${
                            activeTab === 'results'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        View Results
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'edit' && (
                <Edit>
                    <SimpleForm onSubmit={(data) => setExamTitle(data.title)}>
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
                        <BooleanInput source="isProctored" />
                    </SimpleForm>
                </Edit>
            )}

            {activeTab === 'assign' && examId && (
                <ExamAssign examId={examId} />
            )}

            {activeTab === 'results' && examId && (
                <ExamResults examId={examId} examTitle={examTitle} />
            )}
        </div>
    );
};

export default ExamEdit;
