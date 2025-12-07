import { BrowserRouter, Routes, Route, Link as RouterLink, Navigate } from "react-router-dom";
import { AppBar, Box, Toolbar, Typography, Link } from "@mui/material";
import { Stundenplan } from "./pages/Stundenplan/Stundenplan";

function App() {
	return (
		<BrowserRouter>
			<Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
				<AppBar position="static">
					<Toolbar>
						<Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
							DeitaZero
						</Typography>
						<Link component={RouterLink} to="/modules" color="inherit">
							Stundenplan
						</Link>
					</Toolbar>
				</AppBar>
				<Box component="main" sx={{ flexGrow: 1, p: 3 }}>
					<Routes>
						<Route path="/" element={<Navigate to="/modules" />} />
						<Route path="/modules" element={<Stundenplan />} />
					</Routes>
				</Box>
			</Box>
		</BrowserRouter>
	);
}

export default App;
