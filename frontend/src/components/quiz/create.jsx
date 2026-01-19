import {
    Create,
    SimpleForm,
    TextInput,
    required,
    ReferenceArrayInput,
    SelectArrayInput,
} from "react-admin";

const QuizCreate = () => {
    return (
        <div className="w-full min-h-[calc(100vh-72px)] py-14 px-10">
            <Create>
                <SimpleForm>
                    <TextInput source="title" validate={[required()]} label="Title" />
                    <TextInput source="description" validate={required()} label="Description" />
                    <ReferenceArrayInput source="question" reference="question" label="Select Questions">
                        <SelectArrayInput optionText="question" />
                    </ReferenceArrayInput>
                </SimpleForm>
            </Create>
        </div>
    );
};

export default QuizCreate;