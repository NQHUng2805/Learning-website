import React from 'react';
import { Create, SimpleForm, TextInput, SelectInput, required } from 'react-admin';

const QuestionCreate = () => {
    // Transform form data (4 options + correct answer selector) to backend format
    const transformData = (data) => {
        const allOptions = [
            { label: 'A', value: data.optionA },
            { label: 'B', value: data.optionB },
            { label: 'C', value: data.optionC },
            { label: 'D', value: data.optionD }
        ];

        // Find the correct option value based on selected label (A, B, C, or D)
        const correctValue = allOptions.find(opt => opt.label === data.correctOption)?.value;
        
        // Get incorrect options (all options except the correct one)
        const incorrectOptions = allOptions
            .filter(opt => opt.label !== data.correctOption)
            .map(opt => opt.value);

        // Return in backend format: { question, correctOption, incorrectOptions }
        return {
            question: data.question,
            correctOption: correctValue,
            incorrectOptions: incorrectOptions
        };
    };

    return (
        <div className="w-full min-h-[calc(100vh-72px)] py-14 px-10">
            <Create transform={transformData}>
                <SimpleForm>
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
                </SimpleForm>
            </Create>
        </div>
    );
};

export default QuestionCreate;
