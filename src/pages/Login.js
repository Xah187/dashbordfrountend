import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../App";
import {
  Box,
  Button,
  TextField,
  Typography,
  InputAdornment,
  Alert,
  Paper,
  CircularProgress,
  Divider,
  Chip,
  Stack,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import PhoneIcon from "@mui/icons-material/Phone";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import SendIcon from "@mui/icons-material/Send";
import VerifiedIcon from "@mui/icons-material/Verified";
import TimerIcon from "@mui/icons-material/Timer";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import PersonIcon from "@mui/icons-material/Person";
import EngineeringIcon from "@mui/icons-material/Engineering";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";
import apiClient, { API_BASE_URL } from "api/config";

const FormContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
}));

const SubmitButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(3, 0, 2),
  padding: theme.spacing(1.2),
  borderRadius: theme.spacing(1),
}));

// تنسيقات خاصة لحقول الإدخال
const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiInputLabel-root": {
    color: "text.primary",
    fontWeight: 500,
  },
  "& .MuiOutlinedInput-root": {
    "& fieldset": {
      borderColor: "rgba(0, 0, 0, 0.23)",
    },
    "&:hover fieldset": {
      borderColor: "primary.main",
    },
  },
  "& .MuiInputBase-input": {
    position: "relative",
    zIndex: 2,
  },
}));

// تنسيقات خاصة لحقل رقم الهاتف
const PhoneTextField = styled(TextField)(({ theme }) => ({
  "& .MuiInputLabel-root": {
    color: "text.primary",
    fontWeight: 500,
  },
  "& .MuiOutlinedInput-root": {
    "& fieldset": {
      borderColor: "rgba(0, 0, 0, 0.23)",
    },
    "&:hover fieldset": {
      borderColor: "primary.main",
    },
    "&.Mui-focused fieldset": {
      borderColor: "primary.main",
    },
  },
  "& .MuiInputBase-input": {
    fontSize: "1.1rem",
    letterSpacing: "0.5px",
    direction: "ltr",
    textAlign: "left",
    unicodeBidi: "plaintext",
  },
}));

// تنسيقات خاصة لحقل OTP
const OTPTextField = styled(TextField)(({ theme }) => ({
  "& .MuiInputLabel-root": {
    color: "text.primary",
    fontWeight: 500,
  },
  "& .MuiOutlinedInput-root": {
    "& fieldset": {
      borderColor: "rgba(0, 0, 0, 0.23)",
    },
    "&:hover fieldset": {
      borderColor: "primary.main",
    },
    "&.Mui-focused fieldset": {
      borderColor: "primary.main",
    },
  },
  "& .MuiInputBase-input": {
    fontSize: "1.5rem",
    letterSpacing: "8px",
    textAlign: "center",
    fontWeight: "bold",
    direction: "ltr",
    unicodeBidi: "plaintext",
  },
}));

const Login = () => {
  const { setIsAuthenticated } = useContext(AuthContext);

  // حالات النظام
  const [step, setStep] = useState(1); // 1: إدخال رقم الهاتف، 2: إدخال التحقق، 3: إدخال OTP
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [verificationCode, setVerificationCode] = useState(""); // كود التحقق
  const [userEnteredCode, setUserEnteredCode] = useState(""); // الكود المدخل من المستخدم
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // دالة توليد كود التحقق العشوائي
  const generateVerificationCode = () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  };

  // حالات العد التنازلي
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);

  // لعرض رمز OTP في الواجهة للتجربة
  const [displayOTP, setDisplayOTP] = useState("");

  // حالة نافذة الدعم
  const [supportDialogOpen, setSupportDialogOpen] = useState(false);

  // بيانات المهندسين للدعم
  const supportEngineers = [
    {
      id: 1,
      name: "م/ أحمد سعيد",
      phone: "0582405952",
      role: "Software Engineer",
      avatar: "أ",
      color: "#4CAF50",
    },
    {
      id: 2,
      name: "م/ عبدالرحمن الفيل",
      phone: "0502464530",
      role: "Software Engineer",
      avatar: "ع",
      color: "#2196F3",
    },
    {
      id: 3,
      name: "م/ أحمد العرامي",
      phone: "0567256943",
      role: "IT Manager",
      avatar: "ب",
      color: "#FF9800",
    },
  ];

  // العد التنازلي لإعادة الإرسال
  useEffect(() => {
    let interval = null;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  // تنسيق رقم الهاتف
  const formatPhoneNumber = (value) => {
    // إزالة جميع الأحرف غير الرقمية
    const cleaned = value.replace(/\D/g, "");

    // تحديد الحد الأقصى للأرقام (9 أرقام بعد 966)
    const maxLength = 9;
    const truncated = cleaned.slice(0, maxLength);

    // تنسيق الرقم مع فواصل
    if (truncated.length <= 3) {
      return truncated;
    } else if (truncated.length <= 6) {
      return `${truncated.slice(0, 3)}${truncated.slice(3)}`;
    } else {
      return `${truncated.slice(0, 3)}${truncated.slice(3, 6)}${truncated.slice(
        6
      )}`;
    }
  };

  // التحقق من صحة رقم الهاتف
  const validatePhoneNumber = (phone) => {
    const cleaned = phone.replace(/\D/g, "");
    return cleaned.length === 9 && cleaned.match(/^[0-9]{9}$/);
  };

  // التعامل مع تغيير رقم الهاتف
  const handlePhoneChange = (e) => {
    const value = e.target.value;
    const formatted = formatPhoneNumber(value);
    setPhoneNumber(formatted);
    setError("");
  };

  // التعامل مع تغيير رمز OTP
  const handleOTPChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4);
    setOtpCode(value);
    setError("");
  };

  // محاكاة إرسال رمز OTP
  const generateOTP = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  // إرسال رمز OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();

    if (!validatePhoneNumber(phoneNumber)) {
      setError("يرجى إدخال رقم هاتف صحيح (9 أرقام)");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // توليد كود التحقق
      const code = generateVerificationCode();
      setVerificationCode(code);
      
      // عرض كود التحقق للمستخدم
      setSuccess(`كود التحقق الخاص بك هو: ${code}`);
      setStep(2); // الانتقال إلى خطوة إدخال كود التحقق
      
      // تخزين كود التحقق مؤقتاً
      localStorage.setItem("verificationCode", code);

      setCountdown(60); // 60 ثانية للعد التنازلي
      setCanResend(false);
    } catch (error) {
      setError("حدث خطأ أثناء إرسال الرمز. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  // إعادة إرسال رمز OTP
  const handleResendOTP = async () => {
    if (!canResend) return;

    setIsLoading(true);
    setError("");

    try {
      const generatedOTP = generateOTP();

      await new Promise((resolve) => setTimeout(resolve, 1500));

      localStorage.setItem("tempOTP", generatedOTP);

      // عرض الرمز الجديد في الواجهة للتجربة
      setDisplayOTP(generatedOTP);

      setSuccess("تم إعادة إرسال رمز التحقق");
      setCountdown(60);
      setCanResend(false);
    } catch (error) {
      setError("حدث خطأ أثناء إعادة إرسال الرمز");
    } finally {
      setIsLoading(false);
    }
  };

  // التحقق من كود التحقق
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    
    if (userEnteredCode.length !== 6) {
      setError("يرجى إدخال كود التحقق المكون من 6 خانات");
      return;
    }

    const storedCode = localStorage.getItem("verificationCode");
    if (userEnteredCode === storedCode) {
      // إذا كان الكود صحيحاً، قم بالاتصال بال API لإرسال رمز OTP
      setIsLoading(true);
      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/dashbord/auth/login`,
          { phoneNumber: phoneNumber },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.TOKEN_ADMIN || "dPdJ0ThcQ6ODl2_z5Nn2iO:APA91bE6yk0i_5M3YAmtAvBwEZIayJ4hOqFDMvQwQwhqTfn2bDwirSInge1kZGskTwvtzsEuZ6-FFU-06NVrAbTmB9UpQ63M9v5tgmKwj4_evGfJMz6PlIiWxOlvhHdnhR6fAbodYhRV"}  `,
            },
          }
        );
        
        if (response.status === 200) {
          setStep(3); // الانتقال إلى خطوة إدخال OTP
          setSuccess(`تم إرسال رمز التحقق إلى +966 ${phoneNumber}`);
          // مسح كود التحقق المخزن
          localStorage.removeItem("verificationCode");
        } else {
          setError("حدث خطأ أثناء إرسال رمز التحقق");
        }
      } catch (error) {
        setError("حدث خطأ أثناء الاتصال بالخادم");
      } finally {
        setIsLoading(false);
      }
    } else {
      setError("كود التحقق غير صحيح");
    }
  };

  // التحقق من رمز OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (otpCode.length !== 4) {
      setError("يرجى إدخال رمز التحقق المكون من 4 أرقام");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      await axios
        .get(
          `${API_BASE_URL}/api/dashbord/auth/verification?output=${otpCode}&PhoneNumber=${phoneNumber}`,

          {
           headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.TOKEN_ADMIN || "dPdJ0ThcQ6ODl2_z5Nn2iO:APA91bE6yk0i_5M3YAmtAvBwEZIayJ4hOqFDMvQwQwhqTfn2bDwirSInge1kZGskTwvtzsEuZ6-FFU-06NVrAbTmB9UpQ63M9v5tgmKwj4_evGfJMz6PlIiWxOlvhHdnhR6fAbodYhRV"}  `,
            },  
          
          }
        )
        .then((res, err) => {
          if (res.status === 501) return setError(res.masseg);
          if (res.data.success !== false) {
            localStorage.setItem("user", JSON.stringify(res.data));
            setStep(2);
            setSuccess("تم التحقق بنجاح! جاري تسجيل الدخول...");
           

            localStorage.setItem("lastLoginTime", new Date().toISOString());
            // انتظار قليل قبل تسجيل الدخول
            setTimeout(() => {
              setIsAuthenticated(true);
            }, 1000);
          } else {
            setError("رمز التحقق غير صحيح. يرجى المحاولة مرة أخرى.");
          }
        });
      // حفظ بيانات المستخدم للاستخدام في النظام

      setDisplayOTP("");
    } catch (error) {
      setError("حدث خطأ أثناء التحقق. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  // العودة لخطوة إدخال رقم الهاتف
  const handleBackToPhone = () => {
    setStep(1);
    setOtpCode("");
    setError("");
    setSuccess("");
    setDisplayOTP("");
  };

  // فتح نافذة الدعم
  const handleSupportClick = () => {
    setSupportDialogOpen(true);
  };

  // إغلاق نافذة الدعم
  const handleSupportClose = () => {
    setSupportDialogOpen(false);
  };

  // فتح الواتس اب مع رقم محدد
  const handleWhatsAppContact = (engineer) => {
    const phoneNumber = engineer.phone.replace(/^0/, "+966"); // تحويل 0 إلى +966
    const message = `السلام عليكم ${engineer.name}%0Aأحتاج مساعدة في تسجيل الدخول إلى نظام مشرف الإنشاءات`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

    // فتح رابط الواتس اب في نافذة جديدة
    window.open(whatsappUrl, "_blank");

    // إغلاق النافذة
    setSupportDialogOpen(false);
  };

  return (
    <>
      <Paper elevation={3} sx={{ p: 4, maxWidth: 400, mx: "auto", mt: 4 }}>
        <FormContainer>
          {/* عنوان الصفحة */}
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{ fontWeight: 600, color: "primary.main", mb: 1 }}
            >
              تسجيل الدخول
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {step === 1
                ? "أدخل رقم هاتفك لتلقي رمز التحقق"
                : "أدخل رمز التحقق المُرسل إلى هاتفك"}
            </Typography>
          </Box>

          {/* رسائل الخطأ والنجاح */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {/* الخطوة الأولى: إدخال رقم الهاتف */}
          {step === 1 && (
            <Box component="form" onSubmit={handleSendOTP}>
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="body2"
                  sx={{ mb: 2, color: "text.secondary", textAlign: "center" }}
                >
                  سيتم إرسال رمز تحقق مكون من 4 أرقام إلى رقم هاتفك
                </Typography>

                <PhoneTextField
                  fullWidth
                  label="رقم الهاتف"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  placeholder="5XXXXXXXX"
                  variant="outlined"
                  autoFocus
                  required
                  dir="ltr"
                  inputProps={{
                    maxLength: 11,
                    dir: "ltr",
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <PhoneIcon color="primary" />
                          <Chip
                            label="+966"
                            size="small"
                            color="primary"
                            sx={{ fontWeight: "bold" }}
                          />
                        </Box>
                      </InputAdornment>
                    ),
                  }}
                  helperText="مثال: 501 234 567"
                />
              </Box>

              <SubmitButton
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading || !validatePhoneNumber(phoneNumber)}
                startIcon={
                  isLoading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <SendIcon />
                  )
                }
              >
                {isLoading ? "جاري الإرسال..." : "إرسال رمز التحقق"}
              </SubmitButton>
            </Box>
          )}

          {/* الخطوة الثانية: إدخال كود التحقق */}
          {step === 2 && (
            <Box component="form" onSubmit={handleVerifyCode}>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ textAlign: "center", mb: 3 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: "text.secondary" }}>
                    أدخل كود التحقق المعروض أدناه:
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: "bold", color: "primary.main", mb: 2 }}>
                    {verificationCode}
                  </Typography>
                </Box>

                <OTPTextField
                  fullWidth
                  label="كود التحقق"
                  value={userEnteredCode}
                  onChange={(e) => setUserEnteredCode(e.target.value.toUpperCase().slice(0, 6))}
                  placeholder="XXXXXX"
                  variant="outlined"
                  autoFocus
                  required
                  inputProps={{
                    maxLength: 6,
                    style: { textAlign: "center", letterSpacing: "0.5em" }
                  }}
                />
              </Box>

              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  onClick={handleBackToPhone}
                  variant="outlined"
                  fullWidth
                  startIcon={<ArrowBackIcon />}
                >
                  رجوع
                </Button>
                <SubmitButton
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={isLoading || userEnteredCode.length !== 6}
                  startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <VerifiedIcon />}
                >
                  {isLoading ? "جاري التحقق..." : "تحقق"}
                </SubmitButton>
              </Box>
            </Box>
          )}

          {/* الخطوة الثالثة: إدخال رمز OTP */}
          {step === 3 && (
            <Box component="form" onSubmit={handleVerifyOTP}>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ textAlign: "center", mb: 3 }}>
                  <Typography
                    variant="body2"
                    sx={{ mb: 1, color: "text.secondary" }}
                  >
                    تم إرسال رمز التحقق إلى:
                  </Typography>
                  <Chip
                    label={`+966 ${phoneNumber}`}
                    icon={<PhoneIcon />}
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: "bold" }}
                  />

                  {/* عرض رمز OTP للتجربة */}
                  {displayOTP && (
                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        backgroundColor: "success.light",
                        borderRadius: 2,
                        border: "2px solid",
                        borderColor: "success.main",
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          mb: 1,
                          color: "success.contrastText",
                          fontWeight: "bold",
                        }}
                      >
                        🔐 رمز التحقق للتجربة:
                      </Typography>
                      <Button
                        variant="contained"
                        color="success"
                        size="large"
                        onClick={() => setOtpCode(displayOTP)}
                        sx={{
                          fontSize: "1.8rem",
                          fontWeight: "bold",
                          letterSpacing: "8px",
                          minWidth: "200px",
                          fontFamily: "monospace",
                        }}
                      >
                        {displayOTP}
                      </Button>
                      <Typography
                        variant="caption"
                        sx={{
                          display: "block",
                          mt: 1,
                          color: "success.contrastText",
                        }}
                      >
                        اضغط على الرمز لإدخاله تلقائياً
                      </Typography>
                    </Box>
                  )}
                </Box>

                <OTPTextField
                  fullWidth
                  label="رمز التحقق"
                  value={otpCode}
                  onChange={handleOTPChange}
                  placeholder="0000"
                  variant="outlined"
                  autoFocus
                  required
                  dir="ltr"
                  inputProps={{
                    maxLength: 4,
                    dir: "ltr",
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                  helperText="أدخل الرمز المكون من 4 أرقام"
                />
              </Box>

              <SubmitButton
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading || otpCode.length !== 4}
                startIcon={
                  isLoading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <VerifiedIcon />
                  )
                }
              >
                {isLoading ? "جاري التحقق..." : "تحقق من الرمز"}
              </SubmitButton>

              {/* إعادة الإرسال والعودة */}
              <Box sx={{ mt: 2 }}>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={handleBackToPhone}
                      disabled={isLoading}
                      startIcon={<ArrowBackIcon />}
                      sx={{ fontWeight: 500 }}
                    >
                      تغيير الرقم
                    </Button>
                  </Grid>

                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="text"
                      onClick={handleResendOTP}
                      disabled={!canResend || isLoading}
                      startIcon={countdown > 0 ? <TimerIcon /> : <SendIcon />}
                      sx={{ fontWeight: 500 }}
                    >
                      {countdown > 0
                        ? `إعادة إرسال (${countdown}s)`
                        : "إعادة إرسال"}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}

          {/* معلومات الدعم */}
          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
              تواجه مشكلة؟
            </Typography>
            <Button
              variant="text"
              size="small"
              onClick={handleSupportClick}
              startIcon={<WhatsAppIcon />}
              sx={{ fontWeight: 600, color: "primary.main" }}
            >
              تواصل مع الدعم
            </Button>
          </Box>
        </FormContainer>
      </Paper>

      {/* نافذة اختيار الدعم */}
      <Dialog
        open={supportDialogOpen}
        onClose={handleSupportClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pb: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <WhatsAppIcon sx={{ color: "#25D366", fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              تواصل مع الدعم الفني
            </Typography>
          </Box>
          <Button
            onClick={handleSupportClose}
            size="small"
            sx={{ minWidth: "auto", borderRadius: "50%" }}
          >
            <CloseIcon />
          </Button>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <Typography
            variant="body2"
            sx={{ mb: 3, color: "text.secondary", textAlign: "center" }}
          >
            اختر المهندس المناسب للتواصل معه عبر الواتس اب
          </Typography>

          <List sx={{ p: 0 }}>
            {supportEngineers.map((engineer) => (
              <ListItem key={engineer.id} sx={{ p: 0, mb: 1 }}>
                <ListItemButton
                  onClick={() => handleWhatsAppContact(engineer)}
                  sx={{
                    borderRadius: 2,
                    border: "1px solid #e0e0e0",
                    p: 2,
                    transition: "all 0.3s ease",
                    "&:hover": {
                      backgroundColor: "#f5f5f5",
                      borderColor: "#25D366",
                      transform: "translateY(-2px)",
                      boxShadow: "0 4px 12px rgba(37, 211, 102, 0.2)",
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: engineer.color,
                        color: "white",
                        fontWeight: "bold",
                        width: 50,
                        height: 50,
                      }}
                    >
                      {engineer.avatar}
                    </Avatar>
                  </ListItemAvatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: "bold", mb: 0.5 }}
                    >
                      {engineer.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary", mb: 0.5 }}
                    >
                      {engineer.role}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <WhatsAppIcon sx={{ color: "#25D366", fontSize: 16 }} />
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#25D366",
                          fontWeight: "bold",
                          direction: "ltr",
                        }}
                      >
                        {engineer.phone}
                      </Typography>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <WhatsAppIcon sx={{ color: "#25D366", fontSize: 32 }} />
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary" }}
                    >
                      اضغط للمراسلة
                    </Typography>
                  </Box>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </DialogContent>

        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={handleSupportClose}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            إلغاء
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Login;
