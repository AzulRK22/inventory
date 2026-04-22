import { alpha, createTheme } from "@mui/material/styles";

export const appTheme = createTheme({
  palette: {
    primary: {
      main: "#315c4a",
      light: "#4f7a67",
      dark: "#224135",
      contrastText: "#f8f4ea",
    },
    secondary: {
      main: "#c76a4a",
      light: "#de8b6d",
      dark: "#9e4d31",
      contrastText: "#fff7f0",
    },
    background: {
      default: "#f6f0e6",
      paper: "#fffaf2",
    },
    text: {
      primary: "#1f2a22",
      secondary: "#5f655f",
    },
    success: {
      main: "#3f7a57",
    },
    warning: {
      main: "#c6903c",
    },
    error: {
      main: "#b4533f",
    },
    divider: "rgba(62, 76, 66, 0.14)",
  },
  shape: {
    borderRadius: 22,
  },
  typography: {
    fontFamily: '"Avenir Next", "Trebuchet MS", "Segoe UI", sans-serif',
    h1: {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: "clamp(2.8rem, 6vw, 4.5rem)",
      lineHeight: 0.94,
      letterSpacing: "-0.04em",
      fontWeight: 700,
    },
    h2: {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: "clamp(2rem, 4vw, 2.9rem)",
      lineHeight: 0.98,
      letterSpacing: "-0.035em",
      fontWeight: 700,
    },
    h3: {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: "clamp(2.1rem, 5vw, 3.4rem)",
      lineHeight: 0.98,
      letterSpacing: "-0.04em",
      fontWeight: 700,
    },
    h4: {
      fontSize: "2rem",
      fontWeight: 700,
      letterSpacing: "-0.03em",
    },
    h5: {
      fontSize: "1.25rem",
      fontWeight: 700,
      lineHeight: 1.15,
    },
    h6: {
      fontSize: "1.1rem",
      fontWeight: 700,
      lineHeight: 1.25,
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.6,
    },
    body2: {
      fontSize: "0.92rem",
      lineHeight: 1.5,
    },
    button: {
      textTransform: "none",
      fontWeight: 700,
      letterSpacing: "-0.01em",
    },
    overline: {
      letterSpacing: "0.12em",
      fontWeight: 700,
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 999,
          paddingInline: 18,
          minHeight: 46,
        },
        containedPrimary: {
          boxShadow: "0 18px 40px rgba(49, 92, 74, 0.18)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 26,
          borderColor: alpha("#315c4a", 0.08),
          boxShadow: "0 24px 60px rgba(61, 56, 42, 0.08)",
          backgroundImage:
            "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,249,239,0.92))",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 24,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: alpha("#fffaf2", 0.9),
          borderRadius: 18,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 18,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 700,
        },
      },
    },
  },
});
