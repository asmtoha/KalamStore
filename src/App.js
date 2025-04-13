// Kalam Store Finance Management App with Firebase
// Tech Stack: React + Bootstrap + Firebase (with real-time sync)

import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, Button, Table, Card, Modal, Alert, Navbar, Nav } from "react-bootstrap";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { 
  getAuth, 
  signOut, 
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  signInWithRedirect,
  getRedirectResult
} from "firebase/auth";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA9NWhFuBAewYqhdV1emj3-8uSH5vYPXD0",
  authDomain: "kalamstorehere.firebaseapp.com",
  projectId: "kalamstorehere",
  storageBucket: "kalamstorehere.firebasestorage.app",
  messagingSenderId: "508630224411",
  appId: "1:508630224411:web:b956693d9af69ec95632be",
  measurementId: "G-YKZY602NFC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Get user-specific document reference
const getUserDocRef = (userId, date) => {
  return doc(db, "kalamStore", userId, "dailyReports", date);
};

// Add this function at the top of the file, after the imports
const getBangladeshDate = () => {
  const now = new Date();
  // Bangladesh is UTC+6
  const bangladeshTime = new Date(now.getTime() + (6 * 60 * 60 * 1000));
  return bangladeshTime.toISOString().split('T')[0];
};

// Add new function to get previous day's date
const getPreviousDay = (date) => {
  const d = new Date(date);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

// Add this function at the top of the file, after the imports
const getCurrentYear = () => {
  return new Date().getFullYear();
};

// Simple Login Component
function Login({ onLogin }) {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is already signed in
        const currentUser = auth.currentUser;
        if (currentUser) {
          localStorage.setItem('user', JSON.stringify(currentUser));
          onLogin(true);
          return;
        }

        // Check for redirect result
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          localStorage.setItem('user', JSON.stringify(result.user));
          onLogin(true);
        }
      } catch (error) {
        console.error("Auth Error:", error);
        setError(error.message);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [onLogin]);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError("");
      
      // Set persistence to LOCAL
      await setPersistence(auth, browserLocalPersistence);
      
      // Use signInWithPopup instead of redirect for better reliability
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        localStorage.setItem('user', JSON.stringify(result.user));
        onLogin(true);
      }
    } catch (error) {
      console.error("Sign In Error:", error);
      setError(error.message);
      setIsLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ 
      minHeight: "100vh"
    }}>
      <Card style={{ 
        width: "400px",
        backgroundColor: "transparent",
        border: "none",
        boxShadow: "none"
      }}>
        <Card.Body className="text-center">
          <h2 className="mb-4" style={{ color: "#2d3748" }}>
            Welcome to Kalam Store
          </h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <Button 
            variant="primary" 
            onClick={handleGoogleSignIn} 
            disabled={isLoading}
            className="w-100 mb-3"
            style={{ 
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
              padding: "15px",
              fontSize: "1.2rem",
              fontWeight: "bold"
            }}
          >
            {isLoading ? "Loading..." : "Let's Go"}
          </Button>
        </Card.Body>
      </Card>
    </Container>
  );
}

// Navigation Component with responsive styles
function Navigation({ activeSection, setActiveSection }) {
  const [isNavExpanded, setIsNavExpanded] = useState(false);

  return (
    <div className="mobile-nav-container">
      <Button 
        variant="light"
        className="d-md-none mobile-nav-toggle"
        onClick={() => setIsNavExpanded(!isNavExpanded)}
        aria-controls="nav-items"
        aria-expanded={isNavExpanded}
        style={{
          padding: '0.5rem',
          border: 'none',
          position: 'absolute',
          left: '0',
          top: '50%',
          transform: 'translateY(-50%)'
        }}
      >
        ☰
      </Button>
      <Nav className={`responsive-nav ${isNavExpanded ? 'expanded' : ''}`} id="nav-items">
        <Nav.Link 
          onClick={() => {
            setActiveSection('dashboard');
            setIsNavExpanded(false);
          }}
          className={`nav-item ${activeSection === 'dashboard' ? 'active' : ''}`}
        >
          🏠 Home
        </Nav.Link>
        <Nav.Link 
          onClick={() => {
            setActiveSection('capital');
            setIsNavExpanded(false);
          }}
          className={`nav-item ${activeSection === 'capital' ? 'active' : ''}`}
        >
          💼 Capital
        </Nav.Link>
        <Nav.Link 
          onClick={() => {
            setActiveSection('accounts');
            setIsNavExpanded(false);
          }}
          className={`nav-item ${activeSection === 'accounts' ? 'active' : ''}`}
        >
          📊 Accounts
        </Nav.Link>
        <Nav.Link 
          onClick={() => {
            setActiveSection('dues');
            setIsNavExpanded(false);
          }}
          className={`nav-item ${activeSection === 'dues' ? 'active' : ''}`}
        >
          💰 Customer Dues
        </Nav.Link>
        <Nav.Link 
          onClick={() => {
            setActiveSection('cash');
            setIsNavExpanded(false);
          }}
          className={`nav-item ${activeSection === 'cash' ? 'active' : ''}`}
        >
          💵 Cash
        </Nav.Link>
      </Nav>
    </div>
  );
}

// Helper function to get dates between start and end
function getDatesInRange(startDate, endDate) {
  const dateList = [];
  const currentDate = new Date(startDate);
  const end = new Date(endDate);
  
  while (currentDate <= end) {
    dateList.push(new Date(currentDate).toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dateList;
}

// Helper function to create empty data structure
function getEmptyDayData() {
  return {
    accounts: {},
    dues: [],
    denominations: {
      "1000": "0",
      "500": "0",
      "200": "0",
      "100": "0",
      "50": "0",
      "20": "0",
      "10": "0",
      "5": "0"
    },
    capitalEntries: [],
    shopOwner: "",
    date: ""
  };
}

// Main App Component
function FinanceApp({ user, activeSection, setActiveSection }) {
  const [accounts, setAccounts] = useState({});
  const [editingAccount, setEditingAccount] = useState(null);
  const [newAccount, setNewAccount] = useState({ company: "", balance: "" });
  const [dues, setDues] = useState([]);
  const [editingDueIndex, setEditingDueIndex] = useState(null);
  const [newDue, setNewDue] = useState({ name: "", amount: "" });
  const [denominations, setDenominations] = useState({
    "1000": "count", "500": "count", "200": "count", "100": "count", "50": "count", "20": "count", "10": "count", "5": "count"
  });
  const [capitalEntries, setCapitalEntries] = useState([]);
  const [newCapital, setNewCapital] = useState({ source: "", amount: "" });
  const [editingCapitalIndex, setEditingCapitalIndex] = useState(null);
  const [shopOwner, setShopOwner] = useState("");
  const [date, setDate] = useState(getBangladeshDate());
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [historicalData, setHistoricalData] = useState({});
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (!user) return;

    const userDocRef = getUserDocRef(user.uid, getBangladeshDate());
    const unsubscribe = onSnapshot(userDocRef, async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setAccounts(data.accounts || {});
        setDues(data.dues || []);
        setDenominations(data.denominations || {
          "1000": "count", "500": "count", "200": "count", "100": "count", "50": "count", "20": "count", "10": "count", "5": "count"
        });
        setCapitalEntries(data.capitalEntries || []);
        setShopOwner(data.shopOwner || "");
      } else {
        // If no data exists for today, try to load yesterday's data
        const previousDay = getPreviousDay(getBangladeshDate());
        const previousDayDocRef = getUserDocRef(user.uid, previousDay);
        const previousDayDoc = await getDoc(previousDayDocRef);
        
        if (previousDayDoc.exists()) {
          const previousData = previousDayDoc.data();
          // Initialize with yesterday's data
          const initialData = {
            accounts: previousData.accounts || {},
            dues: previousData.dues || [],
            denominations: previousData.denominations || {
              "1000": "count", "500": "count", "200": "count", "100": "count", "50": "count", "20": "count", "10": "count", "5": "count"
            },
            capitalEntries: previousData.capitalEntries || [],
            shopOwner: previousData.shopOwner || "",
            date: getBangladeshDate()
          };
          
          // Set the state with yesterday's data
          setAccounts(initialData.accounts);
          setDues(initialData.dues);
          setDenominations(initialData.denominations);
          setCapitalEntries(initialData.capitalEntries);
          setShopOwner(initialData.shopOwner);
          
          // Save the inherited data to today's document
          await setDoc(userDocRef, initialData);
        } else {
          // If no previous data exists, initialize with empty data
          const initialData = {
            accounts: {},
            dues: [],
            denominations: {
              "1000": "count", "500": "count", "200": "count", "100": "count", "50": "count", "20": "count", "10": "count", "5": "count"
            },
            capitalEntries: [],
            shopOwner: "",
            date: getBangladeshDate()
          };
          await setDoc(userDocRef, initialData);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!loading && user) {
      const saveData = async () => {
        const userDocRef = getUserDocRef(user.uid, getBangladeshDate());
        await setDoc(userDocRef, {
          accounts, 
          dues, 
          denominations, 
          capitalEntries, 
          shopOwner, 
          date: getBangladeshDate()
        }, { merge: true }); // Add merge: true to prevent overwriting
      };
      saveData();
    }
  }, [accounts, dues, denominations, capitalEntries, shopOwner, loading, user]);

  const loadHistoricalData = async (targetDate) => {
    if (!user) return;
    
    const userDocRef = getUserDocRef(user.uid, targetDate);
    const docSnap = await getDoc(userDocRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      setHistoricalData(prev => ({
        ...prev,
        [targetDate]: data
      }));
      return data;
    }
    return null;
  };

  const handleExportToExcel = async (targetDate = date) => {
    // Load data for the target date if not already loaded
    if (!historicalData[targetDate]) {
      const data = await loadHistoricalData(targetDate);
      if (!data) {
        alert(`No data found for ${targetDate}`);
        return;
      }
    }

    const data = historicalData[targetDate] || {
      accounts, dues, denominations, capitalEntries, shopOwner, date: targetDate
    };

    const workbook = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ["Kalam Store - Daily Report"],
      ["Date", targetDate],
      ["Shop Owner", data.shopOwner],
      ["Total Capital", data.capitalEntries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0)],
      ["Total Current Balance", Object.values(data.accounts).reduce((sum, val) => sum + Number(val || 0), 0) + 
                                data.dues.reduce((sum, item) => sum + Number(item.amount), 0) +
                                Object.entries(data.denominations).reduce((sum, [note, count]) => 
                                  sum + (count === "count" ? 0 : Number(note) * Number(count)), 0)],
      ["Total Account Balance", Object.values(data.accounts).reduce((sum, val) => sum + Number(val || 0), 0)],
      ["Total Customer Dues", data.dues.reduce((sum, item) => sum + Number(item.amount), 0)],
      ["Total Cash", Object.entries(data.denominations).reduce((sum, [note, count]) => 
        sum + (count === "count" ? 0 : Number(note) * Number(count)), 0)],
      ["Total Profit", Object.values(data.accounts).reduce((sum, val) => sum + Number(val || 0), 0) + 
                      data.dues.reduce((sum, item) => sum + Number(item.amount), 0) +
                      Object.entries(data.denominations).reduce((sum, [note, count]) => 
                        sum + (count === "count" ? 0 : Number(note) * Number(count)), 0) -
                      data.capitalEntries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0)]
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

    // Capital Entries Sheet
    const capitalData = [
      ["Capital Entries"],
      ["Source", "Amount"]
    ].concat(data.capitalEntries.map(entry => [entry.source, entry.amount]));
    const capitalSheet = XLSX.utils.aoa_to_sheet(capitalData);
    XLSX.utils.book_append_sheet(workbook, capitalSheet, "Capital Entries");

    // Account Balances Sheet
    const accountData = [
      ["Account Balances"],
      ["Company", "Balance"]
    ].concat(Object.entries(data.accounts).map(([company, balance]) => [company, balance]));
    const accountSheet = XLSX.utils.aoa_to_sheet(accountData);
    XLSX.utils.book_append_sheet(workbook, accountSheet, "Account Balances");

    // Customer Dues Sheet
    const duesData = [
      ["Customer Dues"],
      ["Customer", "Amount"]
    ].concat(data.dues.map(due => [due.name, due.amount]));
    const duesSheet = XLSX.utils.aoa_to_sheet(duesData);
    XLSX.utils.book_append_sheet(workbook, duesSheet, "Customer Dues");

    // Cash Denominations Sheet
    const cashData = [
      ["Cash Denominations"],
      ["Denomination", "Count", "Total"]
    ].concat(Object.entries(data.denominations).map(([denom, count]) => [
      denom,
      count,
      count === "count" ? 0 : denom * count
    ]));
    const cashSheet = XLSX.utils.aoa_to_sheet(cashData);
    XLSX.utils.book_append_sheet(workbook, cashSheet, "Cash Denominations");

    // Generate filename with login username, shop name, owner name, and date
    const formattedDate = targetDate.split('-').reverse().join('-');
    const loginUsername = user?.displayName || user?.email || "Unknown";
    const shopName = "KalamStore";
    const ownerName = data.shopOwner || "Unknown";
    const excelFilename = `${loginUsername}_${shopName}_${ownerName}_${formattedDate}.xlsx`;

    // Save the file
    XLSX.writeFile(workbook, excelFilename);
  };

  const clearDenominations = () => {
    const cleared = {};
    Object.keys(denominations).forEach(key => (cleared[key] = "count"));
    setDenominations(cleared);
  };

  const calculateTotalAccountBalance = () => {
    return Object.values(accounts).reduce((sum, val) => sum + Number(val || 0), 0);
  };

  const calculateTotalDues = () => {
    return dues.reduce((sum, item) => sum + Number(item.amount), 0);
  };

  const calculateTotalCash = () => {
    return Object.entries(denominations).reduce((sum, [note, count]) => 
      sum + (count === "count" ? 0 : Number(note) * Number(count)), 0);
  };

  const calculateTotalCapital = () => {
    return capitalEntries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  };

  const calculateTotalCurrentBalance = () => {
    return calculateTotalAccountBalance() + calculateTotalDues() + calculateTotalCash();
  };

  const calculateProfit = () => {
    return calculateTotalCurrentBalance() - calculateTotalCapital();
  };

  const handleDateChange = async (newDate) => {
    setDate(newDate);
    setLoading(true);
    
    // Load data for the new date
    const userDocRef = getUserDocRef(user.uid, newDate);
    const docSnap = await getDoc(userDocRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      setAccounts(data.accounts || {});
      setDues(data.dues || []);
      setDenominations(data.denominations || {
        "1000": "count", "500": "count", "200": "count", "100": "count", "50": "count", "20": "count", "10": "count", "5": "count"
      });
      setCapitalEntries(data.capitalEntries || []);
      setShopOwner(data.shopOwner || "");
    } else {
      // If no data exists for this date, initialize with empty values
      setAccounts({});
      setDues([]);
      setDenominations({
        "1000": "count", "500": "count", "200": "count", "100": "count", "50": "count", "20": "count", "10": "count", "5": "count"
      });
      setCapitalEntries([]);
      setShopOwner("");
    }
    setLoading(false);
  };

  const handleDateRangeExport = async () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates");
      return;
    }

    try {
      const dateRange = getDatesInRange(startDate, endDate);
      const wb = XLSX.utils.book_new();
      
      // Load all data in parallel
      const dataPromises = dateRange.map(async (date) => {
        const docRef = getUserDocRef(user.uid, date);
        const docSnap = await getDoc(docRef);
        return {
          date,
          data: docSnap.exists() ? docSnap.data() : getEmptyDayData()
        };
      });

      // Wait for all data to be loaded
      const allData = await Promise.all(dataPromises);

      // Pre-calculate column widths
      const columnWidths = [
        { wch: 25 },  // Column A
        { wch: 20 },  // Column B
        { wch: 15 }   // Column C
      ];

      // Process each day's data and create sheets
      for (const { date, data: dayData } of allData) {
        // Calculate totals efficiently
        const totalCapital = dayData.capitalEntries?.reduce((sum, entry) => sum + Number(entry.amount || 0), 0) || 0;
        const totalAccounts = Object.values(dayData.accounts || {}).reduce((sum, val) => sum + Number(val || 0), 0);
        const totalDues = dayData.dues?.reduce((sum, due) => sum + Number(due.amount || 0), 0) || 0;
        const totalCash = Object.entries(dayData.denominations || {}).reduce((sum, [note, count]) => 
          sum + (count === "count" ? 0 : Number(note) * Number(count)), 0);
        const totalBalance = totalAccounts + totalDues + totalCash;
        const totalProfit = totalBalance - totalCapital;

        // Prepare all sections data at once
        const capitalEntries = (dayData.capitalEntries || []).map(entry => 
          [entry.source || "", entry.amount ? `${entry.amount} ৳` : "0 ৳"]);
        
        const accountBalances = Object.entries(dayData.accounts || {}).map(([company, balance]) => 
          [company, balance ? `${balance} ৳` : "0 ৳"]);
        
        const customerDues = (dayData.dues || []).map(due => 
          [due.name || "", due.amount ? `${due.amount} ৳` : "0 ৳"]);
        
        const cashDenominations = Object.entries(dayData.denominations || {}).map(([denom, count]) => [
          `${denom} ৳`,
          count || "0",
          `${(count === "count" ? "0" : denom * count)} ৳`
        ]);

        // Create sheet data in one go
        const sheetData = [
          ["Kalam Store - Daily Report"],
          ["Date", date],
          ["Shop Owner", dayData.shopOwner || ""],
          [""],
          ["Summary"],
          ["Total Capital", `${totalCapital} ৳`],
          ["Total Current Balance", `${totalBalance} ৳`],
          ["Total Account Balance", `${totalAccounts} ৳`],
          ["Total Customer Dues", `${totalDues} ৳`],
          ["Total Cash", `${totalCash} ৳`],
          ["Total Profit", `${totalProfit} ৳`],
          [""],
          ["Capital Entries"],
          ["Source", "Amount"],
          ...capitalEntries,
          [""],
          ["Account Balances"],
          ["Company", "Balance"],
          ...accountBalances,
          [""],
          ["Customer Dues"],
          ["Customer", "Amount"],
          ...customerDues,
          [""],
          ["Cash Denominations"],
          ["Denomination", "Count", "Total"],
          ...cashDenominations
        ];
        
        // Create worksheet efficiently
        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        ws['!cols'] = columnWidths;
        
        // Add worksheet to workbook
        const sheetName = date.split('-').reverse().join('-');
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      }
      
      // Generate filename
      const formattedStartDate = startDate.split('-').reverse().join('-');
      const formattedEndDate = endDate.split('-').reverse().join('-');
      const loginUsername = user?.displayName || user?.email || "Unknown";
      const filename = `${loginUsername}_KalamStore_${shopOwner || "Unknown"}_${formattedStartDate}_to_${formattedEndDate}.xlsx`;
      
      // Save the file
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Error generating report. Please try again.");
    }
  };

  if (loading) return <Container className="my-4 text-center"><h4>Loading data...</h4></Container>;

  return (
    <Container className="my-4">
      {activeSection === 'dashboard' && (
        <>
      <div className="text-center mb-4 py-3" style={{ backgroundColor: "#e3f2fd", borderRadius: "10px" }}>
            <h2 style={{ fontWeight: "bold", color: "#1a237e" }}>Kalam Store Dashboard</h2>
            <p className="text-muted">Data automatically inherited from previous day. Modify as needed.</p>
      </div>

      <div className="p-3 mb-3" style={{ backgroundColor: "#f1f1f1", borderRadius: "10px" }}>
        <Form>
          <Row className="align-items-end">
            <Col md={5}>
              <Form.Group>
                <Form.Label>👤 Shop Owner</Form.Label>
                <Form.Control value={shopOwner} onChange={(e) => setShopOwner(e.target.value)} />
              </Form.Group>
            </Col>
            <Col md={5}>
              <Form.Group>
                    <Form.Label>🗓 Today's Date</Form.Label>
                    <Form.Control 
                      type="date" 
                      value={getBangladeshDate()} 
                      readOnly
                      style={{ backgroundColor: "#f8f9fa" }}
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Button 
                    variant="success" 
                    onClick={() => handleExportToExcel(getBangladeshDate())}
                    style={{ 
                      background: "linear-gradient(135deg, #4CAF50 0%, #45a049 100%)",
                      border: "none",
                      padding: "10px 20px",
                      fontWeight: "bold"
                    }}
                  >
                    📊 Export Today's Report
                  </Button>
                </Col>
              </Row>
              <Row className="mt-3">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>📅 Start Date</Form.Label>
                    <Form.Control 
                      type="date" 
                      value={startDate} 
                      onChange={(e) => setStartDate(e.target.value)} 
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>📅 End Date</Form.Label>
                    <Form.Control 
                      type="date" 
                      value={endDate} 
                      onChange={(e) => setEndDate(e.target.value)} 
                    />
              </Form.Group>
            </Col>
            <Col md={2}>
                  <Button 
                    variant="info" 
                    onClick={handleDateRangeExport}
                    style={{ 
                      background: "linear-gradient(135deg, #2196F3 0%, #1976D2 100%)",
                      border: "none",
                      padding: "10px 20px",
                      fontWeight: "bold"
                    }}
                  >
                    📊 Export Date Range Report
                  </Button>
            </Col>
          </Row>
        </Form>
      </div>

      <Row className="mb-4">
            <Col md={4}>
              <Card bg="primary" text="white" className="text-center mb-3">
                <Card.Body>
                  <Card.Title>💼 Total Capital</Card.Title>
                  <Card.Text><strong>{calculateTotalCapital()} ৳</strong></Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card bg="dark" text="white" className="text-center mb-3">
                <Card.Body>
                  <Card.Title>📊 Total Current Balance</Card.Title>
                  <Card.Text><strong>{calculateTotalCurrentBalance()} ৳</strong></Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card bg="warning" text="dark" className="text-center mb-3">
            <Card.Body>
                  <Card.Title>🏦 Total Account Balance</Card.Title>
                  <Card.Text><strong>{calculateTotalAccountBalance()} ৳</strong></Card.Text>
            </Card.Body>
          </Card>
        </Col>
            <Col md={4}>
              <Card bg="info" text="white" className="text-center mb-3">
            <Card.Body>
                  <Card.Title>💳 Total Customer Dues</Card.Title>
                  <Card.Text><strong>{calculateTotalDues()} ৳</strong></Card.Text>
            </Card.Body>
          </Card>
        </Col>
            <Col md={4}>
              <Card bg="secondary" text="white" className="text-center mb-3">
            <Card.Body>
                  <Card.Title>💰 Total Cash</Card.Title>
                  <Card.Text><strong>{calculateTotalCash()} ৳</strong></Card.Text>
            </Card.Body>
          </Card>
        </Col>
            <Col md={4}>
              <Card 
                bg={calculateProfit() === 0 ? "white" : (calculateProfit() < 0 ? "danger" : "success")} 
                text={calculateProfit() === 0 ? "dark" : "white"} 
                className="text-center mb-3"
              >
            <Card.Body>
                  <Card.Title>📈 Total Profit</Card.Title>
                  <Card.Text><strong>{calculateProfit()} ৳</strong></Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
        </>
      )}

      {activeSection === 'capital' && (
      <div className="p-3 mb-3 capital-form" style={{ backgroundColor: "#e8f5e9", borderRadius: "10px" }}>
          <h2 className="mb-4">💼 Capital Management</h2>
        <Form>
          <Row className="mb-3">
            <Col>
              <Form.Group>
                <Form.Label>Source</Form.Label>
                <Form.Control 
                  placeholder="Enter source" 
                  value={newCapital.source} 
                  onChange={(e) => setNewCapital({ ...newCapital, source: e.target.value })} 
                />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group>
                <Form.Label>Amount</Form.Label>
                <Form.Control 
                  type="number"
                  placeholder="Enter amount" 
                  value={newCapital.amount} 
                  onChange={(e) => setNewCapital({ ...newCapital, amount: e.target.value })} 
                />
              </Form.Group>
            </Col>
            <Col>
              <Button 
                onClick={() => {
                  if (newCapital.source && newCapital.amount) {
                    const updated = [...capitalEntries];
                    if (editingCapitalIndex !== null) {
                      updated[editingCapitalIndex] = newCapital;
                      setEditingCapitalIndex(null);
                    } else {
                      updated.push(newCapital);
                    }
                    setCapitalEntries(updated);
                    setNewCapital({ source: "", amount: "" });
                  }
                }}
              >
                {editingCapitalIndex !== null ? "Update" : "Add"}
              </Button>
            </Col>
          </Row>
        </Form>
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Source</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {capitalEntries.map((c, i) => (
              <tr key={i}>
                <td data-label="Source">{c.source}</td>
                <td data-label="Amount">{c.amount} ৳</td>
                <td className="actions">
                  <Button 
                    variant="outline-primary" 
                    onClick={() => {
                      setEditingCapitalIndex(i);
                      setNewCapital(c);
                    }}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="outline-danger" 
                    onClick={() => {
                      const updated = capitalEntries.filter((_, index) => index !== i);
                      setCapitalEntries(updated);
                    }}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
          <p><strong>Total Capital:</strong> {calculateTotalCapital()} ৳</p>
      </div>
      )}

      {activeSection === 'accounts' && (
      <div className="p-3 mb-3 accounts-form" style={{ backgroundColor: "#fce4ec", borderRadius: "10px" }}>
          <h2 className="mb-4">🏦 Account Management</h2>
        <Form>
          <Row className="mb-3">
            <Col>
              <Form.Group>
                <Form.Label>Company Name</Form.Label>
                <Form.Control 
                  placeholder="Enter company name" 
                  value={newAccount.company} 
                  onChange={(e) => setNewAccount({ ...newAccount, company: e.target.value })} 
                />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group>
                <Form.Label>Amount</Form.Label>
                <Form.Control 
                  type="number"
                  placeholder="Enter amount" 
                  value={newAccount.balance} 
                  onChange={(e) => setNewAccount({ ...newAccount, balance: e.target.value })} 
                />
              </Form.Group>
            </Col>
            <Col>
              <Button 
                onClick={() => {
                  if (newAccount.company && newAccount.balance) {
                    const updatedAccounts = { ...accounts, [newAccount.company]: newAccount.balance };
                    setAccounts(updatedAccounts);
                    setNewAccount({ company: "", balance: "" });
                  }
                }}
              >
                {editingAccount ? "Update" : "Add"}
              </Button>
            </Col>
          </Row>
        </Form>
        <Table striped bordered hover>
            <thead><tr><th>Company</th><th>Amount</th><th>Actions</th></tr></thead>
          <tbody>
            {Object.entries(accounts).map(([company, balance], index) => (
              <tr key={index}>
                <td data-label="Company">{company}</td>
                <td data-label="Amount">{balance} ৳</td>
                <td className="actions">
                  <Button 
                    variant="outline-primary" 
                    onClick={() => {
                      setEditingAccount(company);
                      setNewAccount({ company, balance });
                    }}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="outline-danger" 
                    onClick={() => {
                      const updatedAccounts = { ...accounts };
                      delete updatedAccounts[company];
                      setAccounts(updatedAccounts);
                    }}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
          <p><strong>Total Account Balance:</strong> {calculateTotalAccountBalance()} ৳</p>
      </div>
      )}

      {activeSection === 'dues' && (
      <div className="p-3 mb-3 dues-form" style={{ backgroundColor: "#e1f5fe", borderRadius: "10px" }}>
          <h2 className="mb-4">💳 Customer Dues Management</h2>
        <Form>
          <Row className="mb-3">
            <Col>
              <Form.Group>
                <Form.Label>Customer Name</Form.Label>
                <Form.Control 
                  placeholder="Enter customer name" 
                  value={newDue.name} 
                  onChange={(e) => setNewDue({ ...newDue, name: e.target.value })} 
                />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group>
                <Form.Label>Amount</Form.Label>
                <Form.Control 
                  type="number"
                  placeholder="Enter amount" 
                  value={newDue.amount} 
                  onChange={(e) => setNewDue({ ...newDue, amount: e.target.value })} 
                />
              </Form.Group>
            </Col>
            <Col>
              <Button 
                onClick={() => {
                  if (newDue.name && newDue.amount) {
                    const updatedDues = [...dues, newDue];
                    setDues(updatedDues);
                    setNewDue({ name: "", amount: "" });
                  }
                }}
              >
                {editingDueIndex !== null ? "Update" : "Add"}
              </Button>
            </Col>
          </Row>
        </Form>
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {dues.map((due, index) => (
              <tr key={index}>
                <td data-label="Customer">{due.name}</td>
                <td data-label="Amount">{due.amount} ৳</td>
                <td className="actions">
                  <Button 
                    variant="outline-primary" 
                    onClick={() => {
                      setEditingDueIndex(index);
                      setNewDue(due);
                    }}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="outline-danger" 
                    onClick={() => {
                      const updatedDues = dues.filter((_, i) => i !== index);
                      setDues(updatedDues);
                    }}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
          <p><strong>Total Dues:</strong> {calculateTotalDues()} ৳</p>
      </div>
      )}

      {activeSection === 'cash' && (
      <div className="p-3 mb-3" style={{ backgroundColor: "#e8f5e9", borderRadius: "10px" }}>
          <h2 className="mb-4">💰 Cash Management</h2>
        <Table striped bordered hover>
          <thead><tr><th>Denomination</th><th>Count</th><th>Total</th></tr></thead>
          <tbody>
            {Object.entries(denominations).map(([denom, count], index) => (
              <tr key={index}>
                <td>{denom} ৳</td>
                <td>
                  <Form.Control
                    type="number"
                    value={count}
                    onChange={(e) => {
                      const updatedDenominations = { ...denominations, [denom]: e.target.value };
                      setDenominations(updatedDenominations);
                    }}
                  />
                </td>
                  <td>{count === "count" ? 0 : denom * count} ৳</td>
              </tr>
            ))}
          </tbody>
        </Table>
        <Button variant="outline-danger" onClick={clearDenominations}>Clear Denominations</Button>
          <p><strong>Total Cash:</strong> {calculateTotalCash()} ৳</p>
      </div>
      )}
    </Container>
  );
}

// Root App Component with responsive styles
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showFooter, setShowFooter] = useState(true);

  // Updated scroll handler
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const isAtTop = scrollTop < 50; // Show when within 50px of top
      const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 50; // Show when within 50px of bottom
      
      setShowFooter(isAtTop || isAtBottom);
    };

    // Initial check
    handleScroll();
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Initialize auth state from localStorage if available
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setIsLoggedIn(true);
      setUserName(parsedUser.displayName || parsedUser.email);
      setUser(parsedUser);
    }

    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setIsLoggedIn(true);
        setUserName(user.displayName || user.email);
        setUser(user);
        
        // Store user info in localStorage
        const userInfo = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        };
        localStorage.setItem('user', JSON.stringify(userInfo));

        // Ensure user data exists in Firestore
        const userDocRef = getUserDocRef(user.uid, getBangladeshDate());
        const docSnap = await getDoc(userDocRef);
        
        if (!docSnap.exists()) {
          // Try to get previous day's data
          const previousDay = getPreviousDay(getBangladeshDate());
          const previousDayDocRef = getUserDocRef(user.uid, previousDay);
          const previousDayDoc = await getDoc(previousDayDocRef);
          
          if (previousDayDoc.exists()) {
            // Initialize with previous day's data
            await setDoc(userDocRef, {
              ...previousDayDoc.data(),
              date: getBangladeshDate()
            });
          }
        }
      } else {
        setIsLoggedIn(false);
        setUserName("");
        setUser(null);
        localStorage.removeItem('user');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
        <h4>Loading...</h4>
      </Container>
    );
  }

  if (!isLoggedIn) {
    return <Login onLogin={setIsLoggedIn} />;
  }

  return (
    <>
      <div className="navbar-container" style={{ 
        backgroundColor: "#f8f9fa",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        padding: "clamp(0.5rem, 2vw, 1rem)",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}>
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center" style={{ flex: 1 }}>
            <Navigation activeSection={activeSection} setActiveSection={setActiveSection} />
          </div>
          <div className="d-flex align-items-center gap-3">
            <span className="user-name" style={{ 
              fontWeight: "bold",
              fontSize: "clamp(0.875rem, 2vw, 1rem)",
              whiteSpace: "nowrap"
            }}>
              👤 {userName}
            </span>
            <Button 
              variant="danger" 
              size="sm" 
              onClick={handleLogout}
              style={{
                padding: "0.375rem 0.75rem",
                fontSize: "clamp(0.875rem, 2vw, 1rem)"
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="main-content" style={{
        padding: "clamp(1rem, 3vw, 2rem)",
        marginBottom: showFooter ? "60px" : "0"
      }}>
        <FinanceApp user={user} activeSection={activeSection} setActiveSection={setActiveSection} />
      </div>

      <footer className="text-center py-2" style={{ 
        backgroundColor: "#f8f9fa", 
        fontSize: "clamp(0.7rem, 1.5vw, 0.8rem)", 
        color: "#666",
        position: "fixed",
        bottom: showFooter ? "0" : "-60px",
        width: "100%",
        padding: "clamp(0.5rem, 2vw, 1rem)",
        boxShadow: "0 -2px 4px rgba(0,0,0,0.1)",
        transition: "bottom 0.3s ease-in-out",
        opacity: showFooter ? "1" : "0"
      }}>
        <p className="mb-0">© {getCurrentYear()} Kalam Store</p>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .mobile-nav-container {
            position: relative;
            padding-left: 3rem;
            flex: 1;
          }

          .mobile-nav-toggle {
            display: block !important;
            font-size: 1.5rem !important;
            z-index: 1001 !important;
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%) !important;
            border: 2px solid #dee2e6 !important;
            border-radius: 8px !important;
            width: 45px !important;
            height: 45px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            color: #212529 !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
            transition: all 0.3s ease !important;
          }

          .mobile-nav-toggle:hover {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
          }

          .mobile-nav-toggle:active {
            transform: translateY(1px) !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
          }

          .responsive-nav {
            display: none;
            position: absolute;
            top: calc(100% + 0.5rem);
            left: 0;
            right: 0;
            background-color: #f8f9fa;
            flex-direction: column;
            padding: 0.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 1000;
          }

          .responsive-nav.expanded {
            display: flex;
          }

          .nav-item {
            width: 100% !important;
            padding: 0.75rem 1rem !important;
            margin: 0.25rem 0 !important;
            text-align: left !important;
            white-space: normal !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            display: flex !important;
            align-items: center !important;
            min-height: 45px !important;
            line-height: 1.2 !important;
          }

          .nav-item.active {
            background-color: #007bff !important;
            color: white !important;
            border-radius: 6px !important;
          }

          /* Form layouts */
          .row {
            display: flex !important;
            flex-direction: column !important;
            margin: 0 !important;
          }

          .row > [class*='col-'] {
            width: 100% !important;
            padding: 0.5rem 0 !important;
            margin-bottom: 0.5rem !important;
          }

          /* Form inputs */
          .form-control {
            width: 100% !important;
            height: 45px !important;
            font-size: 1rem !important;
            margin-bottom: 0.75rem !important;
          }

          /* Form groups */
          .form-group {
            width: 100% !important;
            margin-bottom: 1rem !important;
          }

          .form-label {
            display: block !important;
            margin-bottom: 0.5rem !important;
            font-size: 1rem !important;
          }

          /* Table styles for mobile */
          .table thead {
            display: none;
          }

          .table, .table tbody, .table tr, .table td {
            display: block;
            width: 100%;
          }

          .table tr {
            margin-bottom: 1rem;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            background-color: #fff;
            position: relative;
          }

          .table td {
            padding: 0.75rem !important;
            text-align: left;
            border: none;
            border-bottom: 1px solid #dee2e6;
          }

          .table td:before {
            content: attr(data-label);
            font-weight: bold;
            display: block;
            margin-bottom: 0.5rem;
            color: #666;
          }

          /* Action buttons in tables */
          .table td:last-child {
            border-bottom: none;
            background-color: #f8f9fa;
            border-bottom-left-radius: 8px;
            border-bottom-right-radius: 8px;
            padding: 1rem !important;
          }

          .table td.actions {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .table .btn {
            width: 100% !important;
            height: 40px !important;
            margin: 0 !important;
          }

          /* Add button in forms */
          .row > .col:last-child {
            margin-top: 1rem !important;
          }

          .row > .col:last-child .btn {
            width: 100% !important;
            height: 45px !important;
          }

          /* Dashboard stats */
          .dashboard-stats .col-md-4 {
            width: 100% !important;
            margin-bottom: 1rem !important;
          }

          /* Date range inputs */
          .date-range-container {
            flex-direction: column !important;
          }

          .date-range-container .form-group {
            width: 100% !important;
            margin-bottom: 1rem !important;
          }

          /* Export buttons */
          .btn-success, .btn-info {
            width: 100% !important;
            height: auto !important;
            min-height: 48px !important;
            white-space: normal !important;
            word-wrap: break-word !important;
            padding: 10px 15px !important;
            font-size: 0.9rem !important;
            line-height: 1.3 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            text-align: center !important;
            margin-top: 0.5rem !important;
            border-radius: 6px !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
          }

          /* Ensure the button text is properly contained */
          .btn-success span, .btn-info span {
            display: inline-block !important;
            max-width: 100% !important;
            overflow-wrap: break-word !important;
            word-break: break-word !important;
          }
        }

        @media (min-width: 769px) {
          .mobile-nav-toggle {
            display: none;
          }

          .responsive-nav {
            display: flex;
            flex-direction: row;
          }

          .nav-item {
            margin: 0 0.25rem;
          }

          /* Add space between Edit and Delete buttons in desktop view */
          .table td.actions .btn {
            margin-right: 0.5rem !important;
          }

          .table td.actions .btn:last-child {
            margin-right: 0 !important;
          }
        }

        .nav-item {
          border-radius: 4px;
          transition: all 0.3s ease;
          white-space: nowrap;
          font-size: clamp(0.875rem, 2vw, 1rem);
        }

        .nav-item:hover {
          background-color: rgba(0,0,0,0.05);
        }

        .nav-item.active {
          background-color: #007bff;
          color: white !important;
        }

        input[type="date"],
        input[type="text"],
        input[type="number"] {
          padding: 0.5rem;
          border-radius: 4px;
          border: 1px solid #ced4da;
          width: 100%;
          max-width: 300px;
          font-size: clamp(0.875rem, 2vw, 1rem);
        }

        .table-responsive {
          margin: 1rem 0;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .table th {
          white-space: nowrap;
          background-color: #f8f9fa;
        }

        .table td {
          vertical-align: middle;
          font-size: clamp(0.875rem, 2vw, 1rem);
        }

        .card {
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: clamp(1rem, 3vw, 2rem);
        }

        .card-header {
          background-color: #f8f9fa;
          padding: clamp(0.75rem, 2vw, 1.25rem);
          border-bottom: 1px solid rgba(0,0,0,0.125);
        }

        .card-body {
          padding: clamp(1rem, 3vw, 1.5rem);
        }

        .form-group {
          margin-bottom: clamp(1rem, 3vw, 1.5rem);
        }

        .btn {
          padding: 0.5rem 1rem;
          font-size: clamp(0.875rem, 2vw, 1rem);
          border-radius: 4px;
        }

        /* Add smooth scrolling to body */
        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </>
  );
}
