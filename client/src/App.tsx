import { BrowserRouter, Routes, Route, Link as RouterLink } from "react-router-dom";
import { AppBar, Box, Toolbar, Typography, Link } from "@mui/material";
import { Modules } from "./pages/Modules/Modules";
import Home from "./pages/Home/Home";

function App() {
	return (
		<BrowserRouter>
			<Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
				<AppBar position="static">
					<Toolbar>
						<Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
							DeitaZero
						</Typography>
						<Link component={RouterLink} to="/" color="inherit" sx={{ mr: 2 }}>
							Home
						</Link>
						<Link component={RouterLink} to="/modules" color="inherit">
							Modules
						</Link>
					</Toolbar>
				</AppBar>
				<Box component="main" sx={{ flexGrow: 1, p: 3 }}>
					<Routes>
						<Route path="/" element={<Home />} />
						<Route path="/modules" element={<Modules />} />
					</Routes>
				</Box>
			</Box>
		</BrowserRouter>
	);
}

export default App;
