import { BrowserRouter, Routes, Route, Link as RouterLink, Navigate } from "react-router-dom";
import { AppBar, Box, Toolbar, Button } from "@mui/material";
import { Stundenplan } from "./pages/Stundenplan/Stundenplan";
import Module from "./pages/Module/Module";

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
							<Button component={RouterLink} to="/module" color="inherit" sx={{ textTransform: 'none' }}>
								Module
							</Button>
						</Box>
					</Toolbar>
				</AppBar>
				<Box component="main" sx={{ flexGrow: 1, p: 3 }}>
					<Routes>
						<Route path="/" element={<Navigate to="/stundenplan" />} />
						<Route path="/stundenplan" element={<Stundenplan />} />
						<Route path="/module" element={<Module />} />
					</Routes>
				</Box>
			</Box>
		</BrowserRouter>
	);
}

export default App;
