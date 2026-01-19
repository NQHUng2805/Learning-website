import React, { useEffect } from 'react';
import { SimpleForm, TextInput, required, Edit, ReferenceInput, SelectInput, useRecordContext } from 'react-admin';
import { useFormContext } from 'react-hook-form';

const QuestionFormFields = () => {
    const record = useRecordContext();
    const { setValue } = useFormContext();
    
    // Transform data from backend format (correctOption + incorrectOptions) to form format (4 options + selector)
    useEffect(() => {
        if (record && record.correctOption && record.incorrectOptions && Array.isArray(record.incorrectOptions)) {
            // Check if already transformed (has optionA, optionB, etc.)
            if (record.optionA && record.optionB && record.optionC && record.optionD) {
                return; // Already in form format, skip transformation
            }

            // Backend format: correctOption (string) + incorrectOptions (array of 3 strings)
            // Combine all options: incorrectOptions + correctOption
            const allOptions = [...record.incorrectOptions, record.correctOption];
            
            // Find which position contains the correct option
            let correctIndex = allOptions.findIndex(opt => opt === record.correctOption);
            if (correctIndex === -1) {
                // If not found, assume it's the last one
                correctIndex = allOptions.length - 1;
            }
            
            // Map index to label (A, B, C, D)
            const correctLabel = ['A', 'B', 'C', 'D'][correctIndex] || 'A';
            
            // Set form values for the 4 options
            setValue('optionA', allOptions[0] || '', { shouldDirty: false });
            setValue('optionB', allOptions[1] || '', { shouldDirty: false });
            setValue('optionC', allOptions[2] || '', { shouldDirty: false });
            setValue('optionD', allOptions[3] || '', { shouldDirty: false });
            setValue('correctOption', correctLabel, { shouldDirty: false });
        }
    }, [record, setValue]);

    return (
        <>
            <TextInput source="question" validate={[required()]} fullWidth />
            
            <div className="grid grid-cols-1 gap-4 mt-4">
                <div>
                    <TextInput 
                        source="optionA" 
                        label="Option A" 
                        validate={[required()]} 
                        fullWidth 
                    />
                </div>
                <div>
                    <TextInput 
                        source="optionB" 
                        label="Option B" 
                        validate={[required()]} 
                        fullWidth 
                    />
                </div>
                <div>
                    <TextInput 
                        source="optionC" 
                        label="Option C" 
                        validate={[required()]} 
                        fullWidth 
                    />
                </div>
                <div>
                    <TextInput 
                        source="optionD" 
                        label="Option D" 
                        validate={[required()]} 
                        fullWidth 
                    />
                </div>
            </div>

            <SelectInput
                source="correctOption"
                label="Correct Answer"
                choices={[
                    { id: 'A', name: 'A' },
                    { id: 'B', name: 'B' },
                    { id: 'C', name: 'C' },
                    { id: 'D', name: 'D' },
                ]}
                validate={[required()]}
                fullWidth
            />

            <ReferenceInput source="quiz" reference="quiz">
                <SelectInput optionText="title" />
            </ReferenceInput>
        </>
    );
};

const QuestionEdit = () => {
    // Transform data back to backend format before saving
    const transformSave = (data) => {
        const allOptions = [
            { label: 'A', value: data.optionA },
            { label: 'B', value: data.optionB },
            { label: 'C', value: data.optionC },
            { label: 'D', value: data.optionD }
        ];

        // Get the correct option label (A, B, C, or D)
        const correctLabel = data.correctOption || 'A';
        
        // Get the correct option value
        const correctOptionValue = allOptions.find(opt => opt.label === correctLabel)?.value || allOptions[0].value;
        
        // Get incorrect options
        const incorrectOptions = allOptions
            .filter(opt => opt.label !== correctLabel)
            .map(opt => opt.value);

        return {
            question: data.question,
            correctOption: correctOptionValue,
            incorrectOptions: incorrectOptions,
            quiz: data.quiz
        };
    };

    return (
        <div className="w-full min-h-[calc(100vh-72px)] py-14 px-10">
            <Edit transform={transformSave}>
                <SimpleForm>
                    <QuestionFormFields />
                </SimpleForm>
            </Edit>
        </div>
    )
};

export default QuestionEdit;
