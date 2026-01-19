import React from "react";
import PostIcon from "@mui/icons-material/Book";
import UserIcon from "@mui/icons-material/Group";
import QuizIcon from '@mui/icons-material/Quiz';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { Admin, Resource, nanoLightTheme, nanoDarkTheme } from 'react-admin';
import UserList from "../components/user/list";
import UserEdit from "../components/user/edit";
import dataProvider from "../providers/dataProvider";
import CourseList from "../components/course/list";
import CourseCreate from "../components/course/create";
import CourseEdit from "../components/course/edit";
import QuizList from "../components/quiz/list";
import QuizCreate from "../components/quiz/create";
import QuizEdit from "../components/quiz/edit";
import QuestionList from "../components/question/list";
import QuestionCreate from "../components/question/create";
import QuestionEdit from "../components/question/edit";
import Dashboard from "../pages/Dashboard";  
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import ExamList from "../components/exam/list";
import ExamCreate from "../components/exam/create";
import ExamEdit from "../components/exam/edit";

const AdminPanel = () => {
    const { user, loading, accessToken, logout } = useAuth();

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!accessToken || !user) {
        return <Navigate to="/login" replace />;
    }

    if (user.role !== 'admin' && user.role !== 'teacher') {
        return <div>Access denied. Admin or Teacher privileges required.</div>;
    }

    const isAdmin = user.role === 'admin';
    const isTeacher = user.role === 'teacher';

    return (
        <div className="relative">
            <div className="fixed bottom-4 right-4 z-50">
                <button
                    onClick={logout}
                    className="bg-red-600 hover:bg-red-700 text-black font-semibold py-2 px-6 rounded shadow-lg transition-colors"
                    style={{ backgroundColor: '#dc2626', color: '#000000' }}
                >
                    LOGOUT
                </button>
            </div>
            <Admin dataProvider={dataProvider} basename="/adminPanel" theme={nanoLightTheme} darkTheme={nanoDarkTheme} dashboard={Dashboard}>
            {/* Users - Admin only */}
            {isAdmin && (
                <Resource
                    name="users"
                    recordRepresentation="username"
                    list={UserList}
                    edit={UserEdit}
                    icon={UserIcon}
                />
            )}

            {/* Course - Both admin and teacher */}
            <Resource
                name="course"
                recordRepresentation="courseTitle"
                list={CourseList}
                create={CourseCreate}
                edit={CourseEdit}
                icon={PostIcon}
            />

            {/* Quiz - Both admin and teacher */}
            <Resource 
                name="quiz"
                recordRepresentation="title"
                list={QuizList}
                create={QuizCreate}
                edit={QuizEdit}
                icon={QuizIcon}
            />

            {/* Question - Both admin and teacher */}
            <Resource 
                name="question"
                recordRepresentation="question"
                list={QuestionList}
                create={QuestionCreate}
                edit={QuestionEdit}/>

            {/* Exam - Both admin and teacher */}
            <Resource 
                name="exam"
                recordRepresentation="title"
                list={ExamList}
                create={ExamCreate}
                edit={ExamEdit}
                icon={AssignmentIcon}
            />
        </Admin>
        </div>
    );
}

export default AdminPanel;