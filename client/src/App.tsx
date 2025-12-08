import { BrowserRouter, Routes, Route, Link as RouterLink, Navigate } from "react-router-dom";
import { AppBar, Box, Toolbar, Button } from "@mui/material";
import { Stundenplan } from "./pages/Stundenplan/Stundenplan";
import Anwesenheit from "./pages/Anwesenheit/Anwesenheit";

function App() {
	return (
		<BrowserRouter>
			<Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
				<AppBar position="static">
					<Toolbar>
						<Box>
							<Button component={RouterLink} to="/stundenplan" color="inherit" sx={{ textTransform: 'none' }}>
								Stundenplan
							</Button>
							<Button component={RouterLink} to="/anwesenheit" color="inherit" sx={{ textTransform: 'none' }}>
								Anwesenheit
							</Button>
						</Box>
					</Toolbar>
				</AppBar>
				<Box component="main" sx={{ flexGrow: 1, p: 3 }}>
					<Routes>
						<Route path="/" element={<Navigate to="/stundenplan" />} />
						<Route path="/stundenplan" element={<Stundenplan />} />
						<Route path="/anwesenheit" element={<Anwesenheit />} />
					</Routes>
				</Box>
			</Box>
		</BrowserRouter>
	);
}

export default App;
