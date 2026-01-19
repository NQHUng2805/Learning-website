import nodemailer from 'nodemailer';

export async function sendExamAssignmentEmail(studentEmail, studentName, examTitle, examDuration, startTime, endTime, isProctored) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const subject = `New Exam Assigned: ${examTitle}`;
    
    let timeInfo = '';
    if (startTime) {
        timeInfo += `\nStart Time: ${new Date(startTime).toLocaleString()}`;
    }
    if (endTime) {
        timeInfo += `\nEnd Time: ${new Date(endTime).toLocaleString()}`;
    }

    const proctoredInfo = isProctored 
        ? '\n⚠️ This exam requires camera monitoring. Please ensure your camera is working.' 
        : '';

    const text = `Hello ${studentName || 'Student'},

You have been assigned a new exam:

Exam: ${examTitle}
Duration: ${examDuration} minutes${timeInfo}${proctoredInfo}

Please log in to your dashboard to view more details and start the exam when ready.

Best regards,
HUST EDU Team`;

    const mailOptions = {
        from: `"HUST EDU" <${process.env.EMAIL_USER}>`,
        to: studentEmail,
        subject,
        text,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Exam assignment email sent to ${studentEmail}`);
        return true;
    } catch (error) {
        console.error('Error sending exam assignment email:', error);
        return false;
    }
}

export default { sendExamAssignmentEmail };
