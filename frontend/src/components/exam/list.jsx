import React from 'react';
import { List, Datagrid, TextField, BooleanField, DateField, NumberField, EditButton, DeleteButton } from 'react-admin';

const ExamList = () => (
    <div className="w-full min-h-[calc(100vh-72px)] py-14 px-10">
        <List>
            <Datagrid rowClick="edit">
                <TextField source="title" />
                <TextField source="description" />
                <NumberField source="duration" label="Duration (min)" />
                <DateField source="startTime" label="Starts" />
                <DateField source="endTime" label="Ends" />
                <BooleanField source="isProctored" label="Proctored" />
                <EditButton basepath="/exams" />
                <DeleteButton basepath="/exams" />
            </Datagrid>
        </List>
    </div>
);

export default ExamList;
