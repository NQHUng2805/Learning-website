import { SimpleForm, Edit, required, NumberInput, SelectInput } from 'react-admin';
import { useAuth } from '../../context/AuthContext';

const UserEdit = (props) => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    return (
        <div className="w-full min-h-[calc(100vh-72px)] py-14 px-10">
            <Edit {...props} redirect="list">
                <SimpleForm warnWhenUnsavedChanges>
                    <NumberInput source="experience" />
                    <SelectInput
                        source="isVerified"
                        validate={required()}
                        choices={[
                            { id: false, name: 'false' },
                            { id: true, name: 'true' },
                        ]}
                    />
                    {isAdmin && (
                        <SelectInput
                            source="role"
                            validate={required()}
                            choices={[
                                { id: 'user', name: 'User' },
                                { id: 'teacher', name: 'Teacher' },
                                { id: 'admin', name: 'Admin' },
                            ]}
                            helperText="Change user role (Admin only)"
                        />
                    )}
                </SimpleForm>
            </Edit>
        </div>
    )
}

export default UserEdit;