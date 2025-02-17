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
    // Fetch responses for the form
    const responses = await prisma.response.findMany({
      where: { formId: parseInt(formId) },
    });
    // Fetch form details to get questions
    const form = await prisma.form.findUnique({
      where: { id: parseInt(formId) },
    });
    if (!responses || !form) {
      return res.status(404).json({ error: 'Responses or form not found' });
    }
    // Parse questions from the form
    let questions = [];
    try {
      if (typeof form.questions === 'string') {
        questions = JSON.parse(form.questions);
      } else {
        questions = form.questions;
      }
    } catch (error) {
      console.error('Error parsing questions:', error);
      return res.status(500).json({ error: 'Failed to parse form questions' });
    }

    // Create PDF document
    const doc = new PDFDocument({ 
      margin: 50,
      autoFirstPage: false
    });
    
    const filePath = `./form_${formId}_responses.pdf`;
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Add first page
    doc.addPage();
    
    // Store original y position after header
    let startY;
    
    // Add header
    doc.fontSize(16).text('LAKIREDDY BALI REDDY COLLEGE OF ENGINEERING', { align: 'center' });
    doc.moveDown();
    
    // Add form title
    doc.fontSize(14).text(`Form: ${form.title}`, { align: 'center' });
    doc.moveDown(2);
    
    startY = doc.y;
    
    // Define table constants
    const pageWidth = doc.page.width - 100;
    const columnWidths = {
      email: pageWidth * 0.4,
      response: pageWidth * 0.6
    };

    // Track total pages
    let currentPage = 1;
    
    // Process each question
    questions.forEach((question, qIndex) => {
      // Check if we need a new page
      if (doc.y > doc.page.height - 150) {
        // Add page number to current page before creating new one
        addPageNumberAndBorder(doc, currentPage);
        doc.addPage();
        currentPage++;
        doc.y = startY;
      }

      // Display question (left-aligned)
      doc.fontSize(12).text(
        `Question ${qIndex + 1}: ${question.text || question.label || question.question || 'Unknown question'}`,
        50,
        doc.y,
        { 
          align: 'left',
          underline: true,
          width: pageWidth
        }
      );
      doc.moveDown();
      
      // If there are responses, create a table
      if (responses.length > 0) {
        // Table headers
        drawTableRow(doc, ['Email', 'Response'], columnWidths, true);
        
        // Table rows
        responses.forEach((response, rIndex) => {
          // Check if we need a new page before drawing row
          if (doc.y > doc.page.height - 100) {
            // Add page number to current page before creating new one
            addPageNumberAndBorder(doc, currentPage);
            doc.addPage();
            currentPage++;
            doc.y = startY;
            // Redraw header row on new page
            drawTableRow(doc, ['Email', 'Response'], columnWidths, true);
          }

          try {
            let answers = response.answers;
            if (typeof answers === 'string') {
              answers = JSON.parse(answers);
            }
            
            let answer;
            if (question.id && answers[question.id]) {
              answer = answers[question.id];
            } else if (answers[qIndex]) {
              answer = answers[qIndex];
            } else if (question.key && answers[question.key]) {
              answer = answers[question.key];
            }
            
            const answerText = typeof answer === 'object' ? JSON.stringify(answer) : String(answer || 'No response');
            drawTableRow(doc, [response.email || 'No email', answerText], columnWidths, false);
            
          } catch (error) {
            console.error(`Error processing response ${rIndex} for question ${qIndex}:`, error);
            drawTableRow(doc, [response.email || 'No email', 'Error retrieving response'], columnWidths, false);
          }
        });
      } else {
        doc.fontSize(10).text('No responses recorded for this question.', { italic: true });
      }
      
      doc.moveDown(2);
    });

    // Add page number and border to the last page
    addPageNumberAndBorder(doc, currentPage);
    
    doc.end();
    
    writeStream.on('finish', () => {
      res.download(filePath, `form_${formId}_responses.pdf`, (err) => {
        if (err) console.error('Download error:', err);
        fs.unlinkSync(filePath);
      });
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Helper function to draw a table row
function drawTableRow(doc, cells, widths, isHeader) {
  const y = doc.y;
  let x = 50;
  
  if (isHeader) {
    doc.fillColor('black').fontSize(10).font('Helvetica-Bold');
  } else {
    doc.fillColor('black').fontSize(9).font('Helvetica');
  }
  
  const rowHeight = 20;
  
  if (isHeader) {
    doc.fillOpacity(0.1).fillColor('gray').rect(x, y, widths.email + widths.response, rowHeight).fill();
    doc.fillOpacity(1).fillColor('black');
  }
  
  cells.forEach((cell, i) => {
    const width = Object.values(widths)[i];
    doc.rect(x, y, width, rowHeight).stroke();
    
    const cellText = cell.toString().substring(0, 100);
    doc.text(cellText, x + 5, y + 5, {
      width: width - 10,
      align: 'left'
    });
    
    x += width;
  });
  
  doc.y = y + rowHeight;
  return doc;
}

// Helper function to add page number and border
function addPageNumberAndBorder(doc, pageNumber) {
  // Save the current Y position
  const currentY = doc.y;
  
  // Add border
  doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke();
  
  // Add page number at the bottom
  // doc.fontSize(10)
  //    .text(
  //      `Page ${pageNumber}`,
  //      0,
  //      doc.page.height - 50,
  //      { align: 'center' }
  //    );
  
  // Restore the Y position
  doc.y = currentY;
}



// Start server
app.listen(5000, () => console.log('Server running on http://localhost:5000'));