import {
    Create,
    SimpleForm,
    TextInput,
    required,
    ReferenceArrayInput,
    SelectArrayInput,
    ReferenceInput,
    SelectInput,
} from "react-admin";

const QuizCreate = () => {
    return (
        <div className="w-full min-h-[calc(100vh-72px)] py-14 px-10">
            <Create>
                <SimpleForm>
                    <TextInput source="title" validate={[required()]} label="Title" fullWidth />
                    <ReferenceInput source="course" reference="course" label="Course">
                        <SelectInput optionText="courseTitle" validate={[required()]} />
                    </ReferenceInput>
                    <TextInput source="description" validate={required()} label="Description" fullWidth multiline />
                    <ReferenceArrayInput source="question" reference="question" label="Select Questions" fullWidth>
                        <SelectArrayInput optionText="question" />
                    </ReferenceArrayInput>
                </SimpleForm>
            </Create>
        </div>
    );
};

export default QuizCreate;