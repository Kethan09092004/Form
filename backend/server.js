const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const path = require('path');
const nodemailer = require('nodemailer');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail');
const cors = require('cors');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');
const prisma = new PrismaClient();
const app = express();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Middleware
app.use(cors({ origin: 'http://localhost:5173',methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'], credentials: true }));
app.use(express.json());

// Google OAuth login
app.post('/api/auth/google', async (req, res) => {
  const { token } = req.body;
  
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(403).json({ error: 'User not registered' });
    }

    const jwtToken = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);
    res.json({ token: jwtToken });
  } catch (error) {
    console.error('Error in Google authentication:', error);
    res.status(500).json({ error: 'Failed to authenticate with Google' });
  }
});
//Admin google Login
app.post('/api/auth/admin/google', async (req, res) => {
  const { token } = req.body;
  
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user.role === 'admin') {
      return res.status(403).json({ error: `you don't have admin access` });
    }
    

    const jwtToken = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);
    res.json({ token: jwtToken });
  } catch (error) {
    console.error('Error in Google authentication:', error);
    res.status(500).json({ error: 'Failed to authenticate with Google' });
  }
});

// Admin login with OTP
const sendOTPEmail = async (email, otp) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const msg = {
    to: email,
    from: process.env.VERIFIED_SENDER_EMAIL,
    subject: 'Admin Login OTP',
    text: `Your OTP is ${otp}`,
    html: `<p>Your OTP is <strong>${otp}</strong></p>`,
  };

  try {
    await sgMail.send(msg);
    console.log('OTP email sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};

app.post('/api/auth/admin', async (req, res) => {
  const { email } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.role !== 'admin') {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await prisma.oTP.upsert({
    where: { email },
    update: { otp, createdAt: new Date() },
    create: { email, otp },
  });

  try {
    await sendOTPEmail(email, otp);
    res.json({ otp });
  } catch (error) {
    console.error('Error in /api/auth/admin:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP and login admin
app.post('/api/auth/admin/verify', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  const otpRecord = await prisma.oTP.findUnique({ where: { email } });

  if (!otpRecord || otpRecord.otp !== otp) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  const otpExpirationTime = 5 * 60 * 1000; // 5 minutes
  const currentTime = new Date();
  const otpCreationTime = new Date(otpRecord.createdAt);

  if (currentTime - otpCreationTime > otpExpirationTime) {
    return res.status(400).json({ error: 'OTP has expired' });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.role !== 'admin') {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);
  res.json({ token });
});

// Get all forms for faculty
app.get('/api/forms', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const forms = await prisma.form.findMany({ where: { userId: decoded.id } });
    res.json(forms);
  } catch (error) {
    console.error('Error fetching forms:', error);
    res.status(500).json({ error: 'Failed to fetch forms' });
  }
});


// Create a new form
app.post('/api/forms', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded); // Debugging

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { title, description, questions } = req.body;

    // Generate a unique link using the BASE_URL environment variable
    const uniqueLink = `${process.env.BASE_URL}/form/${Math.random().toString(36).substring(2, 15)}`;
    
    // Create the form
    const form = await prisma.form.create({
      data: {
        title,
        description,
        questions,
        userId: user.id, // Use the user's ID from the database
        link: uniqueLink, // Use the dynamically generated link
       
      },
    });

    res.status(201).json({
      id: form.id,
      title: form.title,
      description: form.description,
      link: form.link,
      createdAt: form.createdAt,
      createdBy: user.name, // Return the user's name in response
    });
  } catch (error) {
    console.error('Error creating form:', error);
    res.status(500).json({ error: 'Failed to create form' });
  }
});
// Get form by link (Public access)
// Get form by link (Public access)
app.get('/api/forms/:link', async (req, res) => {
  const { link } = req.params;

  try {
    const form = await prisma.form.findUnique({
      where: { link: `${process.env.BASE_URL}/form/${link}` },
    });

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    res.json(form);
  } catch (error) {
    console.error('Error fetching form:', error);
    res.status(500).json({ error: 'Failed to fetch form' });
  }
});
// Get form by ID
// Get form by ID
app.get('/api/admin/forms/:id', async (req, res) => {
  const { id } = req.params;
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const form = await prisma.form.findUnique({
      where: { id: parseInt(id) },
      include: { user: { select: { name: true } } }, // Include the user who created the form
    });

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    res.json({
      _id: form.id,
      title: form.title,
      description: form.description,
      questions: form.questions,
      createdAt: form.createdAt,
      createdBy: form.user.name,
    });
  } catch (error) {
    console.error('Error fetching form:', error);
    res.status(500).json({ error: 'Failed to fetch form' });
  }
});

// Submit response (Public access)
app.post('/api/responses', async (req, res) => {
  const { formId, answers, email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'User email is required' });
  }

  try {
    const response = await prisma.response.create({
      data: {
        formId,
        answers,
        email, // Store user's email
      },
    });

    res.status(201).json(response);
  } catch (error) {
    console.error('Error submitting response:', error);
    res.status(500).json({ error: 'Failed to submit response' });
  }
});


// Delete a form
app.delete('/api/forms/:id', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await prisma.form.delete({ where: { id: parseInt(req.params.id), userId: decoded.id } });
    res.json({ message: 'Form deleted' });
  } catch (error) {
    console.error('Error deleting form:', error);
    res.status(500).json({ error: 'Failed to delete form' });
  }
});

// Get admin stats
app.get('/api/admin/stats', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const facultyCount = await prisma.user.count({ where: { role: 'faculty' } });
    const formsCount = await prisma.form.count();
    const responsesCount = await prisma.response.count();
    res.json({ facultyCount, formsCount, responsesCount });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// Create faculty account
app.post('/api/admin/create', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { email, name, role } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }

    const userRole = role || 'faculty';

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        role: userRole,
      },
    });
     console.log(JSON.stringify(newUser,null,2));
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating faculty:', error);
    res.status(500).json({ error: 'Failed to create faculty user' });
  }
});

// Get all faculty members
app.get('/api/admin/faculty', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const facultyMembers = await prisma.user.findMany({
      where: { role: 'faculty' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { forms: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedFacultyMembers = facultyMembers.map(faculty => ({
      _id: faculty.id,
      name: faculty.name,
      email: faculty.email,
      role: faculty.role,
      createdAt: faculty.createdAt,
      formsCount: faculty._count.forms,
    }));

    res.json(formattedFacultyMembers);
  } catch (error) {
    console.error('Error fetching faculty members:', error);
    res.status(500).json({ error: 'Failed to fetch faculty members' });
  }
});
app.get('/api/admin/forms', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const forms = await prisma.form.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        link: true,
        createdAt: true,
        _count: { select: { responses: true } },
        user: { select: { name: true } }, // Get the user's name
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedForms = forms.map(form => ({
      _id: form.id,
      title: form.title,
      description: form.description,
      link: form.link,
      createdAt: form.createdAt,
      responsesCount: form._count.responses,
      createdBy: form.user.name, // Include createdBy in response
    }));

    res.json(formattedForms);
  } catch (error) {
    console.error('Error fetching forms:', error);
    res.status(500).json({ error: 'Failed to fetch forms' });
  }
});
app.get('/api/admin/responses/:formId', async (req, res) => {
  const { formId } = req.params;
 
  try {
    // Fetch responses for the form
    const responses = await prisma.response.findMany({
      where: { formId: parseInt(formId) },
    });

    // Fetch the form to get the questions
    const form = await prisma.form.findUnique({
      where: { id: parseInt(formId) },
    });

    if (!responses || !form) {
      return res.status(404).json({ error: 'Responses or form not found' });
    }

    // Format the responses to include email, answers, and questions
    const formattedResponses = responses.map((response) => ({
      email: response.email, // Assuming email is stored in the response
      answers: response.answers,
      questions: form.questions,
    }));

    res.json(formattedResponses);
  } catch (error) {
    console.error('Error fetching responses:', error);
    res.status(500).json({ error: 'Failed to fetch responses' });
  }
});

app.get('/api/admin/responses/download/csv/:formId', async (req, res) => {
  const { formId } = req.params;

  try {
    // Fetch responses for the form
    const responses = await prisma.response.findMany({
      where: { formId: parseInt(formId) },
    });

    // Fetch form details including questions
    const form = await prisma.form.findUnique({
      where: { id: parseInt(formId) },
    });

    if (!responses.length || !form) {
      return res.status(404).json({ error: 'Responses or form not found' });
    }

    // Parse questions from JSON if stored as JSON
    const questions = Array.isArray(form.questions) ? form.questions : JSON.parse(form.questions);

    // Create a mapping of question IDs to actual question text
    const questionMap = {};
    questions.forEach(question => {
      questionMap[question.id] = question.text; // Assuming `text` contains the actual question
    });

    // Extract actual question texts for CSV headers
    const questionArray = Object.values(questionMap);

    // Create CSV headers: ['S.No', 'Email', 'Question 1', 'Question 2', ...]
    const csvFields = ['S.No', 'Email', ...questionArray];

    // Convert responses into CSV format
    const csvData = responses.map((response, index) => {
      const row = {
        'S.No': index + 1,
        'Email': response.email,
      };

      // Map answers using the actual question text
      Object.entries(response.answers).forEach(([questionId, answer]) => {
        const questionText = questionMap[questionId] || `Unknown Question (${questionId})`;
        row[questionText] = answer;
      });

      return row;
    });

    // Convert JSON to CSV
    const parser = new Parser({ fields: csvFields });
    const csv = parser.parse(csvData);

    // Set response headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="form_${formId}_responses.csv"`);
    res.setHeader('Content-Type', 'text/csv');
    
    res.send(csv);
  } catch (error) {
    console.error('Error generating CSV:', error);
    res.status(500).json({ error: 'Failed to generate CSV' });
  }
});


app.get('/api/admin/responses/download/pdf/:formId', async (req, res) => {
  const { formId } = req.params;

  try {
    // Fetch form with questions
    const form = await prisma.form.findUnique({
      where: { id: parseInt(formId) },
    });

    // Fetch all responses for the form
    const responses = await prisma.response.findMany({
      where: { formId: parseInt(formId) },
    });

    if (!form || !responses.length) {
      return res.status(404).json({ error: 'Form or responses not found' });
    }

    // Parse questions from the form (stored as Json in schema)
    let questions = [];
    try {
      questions = form.questions;
      // If questions is already an object (as defined in the schema), no need to parse
    } catch (error) {
      console.error('Error accessing questions:', error);
      return res.status(500).json({ error: 'Failed to access form questions' });
    }

    // Create PDF document
    const doc = new PDFDocument();
    const filePath = `./form_${formId}_responses.pdf`;
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Add header
    doc.fontSize(18).text('LAKIREDDY BALI REDDY COLLEGE OF ENGINEERING', { align: 'center' });
    doc.moveDown();
    
    // Add form title
    doc.fontSize(16).text(`Form: ${form.title}`, { align: 'center' });
    if (form.description) {
      doc.fontSize(12).text(form.description, { align: 'center' });
    }
    doc.moveDown(2);

    // Process each question
    questions.forEach((question, qIndex) => {
      // Get question text based on the structure - adjust according to your actual structure
      const questionText = question.text || question.label || question.question || question.title || `Question ${qIndex + 1}`;
      const questionId = question.id || question.questionId || qIndex.toString();
      
      // Display question
      doc.fontSize(14).text(`Question ${qIndex + 1}: ${questionText}`, { underline: true });
      doc.moveDown();

      // Display all responses for this question
      responses.forEach((response, rIndex) => {
        try {
          // Get answer for this question from the response
          const answers = response.answers;
          
          // Try multiple ways to find the answer for this question
          let answer;
          if (answers[questionId]) {
            answer = answers[questionId];
          } else if (answers[qIndex]) {
            answer = answers[qIndex];
          } else if (answers[questionText]) {
            answer = answers[questionText];
          }

          // Format the answer for display
          let answerText;
          if (answer === undefined || answer === null) {
            answerText = 'No response';
          } else if (typeof answer === 'object') {
            answerText = JSON.stringify(answer);
          } else {
            answerText = String(answer);
          }
          
          // Display the email and answer
          doc.fontSize(10);
          doc.text(`Email: ${response.email || 'Anonymous'}`);
          doc.text(`Response: ${answerText}`);
          doc.moveDown(0.5);
        } catch (error) {
          console.error(`Error processing response ${rIndex} for question ${qIndex}:`, error);
          doc.text(`Respondent ${rIndex + 1} (${response.email || 'Anonymous'}): Error retrieving response`);
        }
      });
      
      doc.moveDown(1.5);
    });

    // Add timestamp at the end
    doc.fontSize(8).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'right' });
    
    doc.end();

    writeStream.on('finish', () => {
      res.download(filePath, `form_${formId}_responses.pdf`, (err) => {
        if (err) console.error('Download error:', err);
        fs.unlinkSync(filePath); // Delete file after sending
      });
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});





// Start server
app.listen(5000, () => console.log('Server running on http://localhost:5000'));