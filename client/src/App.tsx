import "./App.css";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Modules } from "./pages/Modules/Modules"; // Adjust path if needed

// Simple Home Component
const Home = () => (
	<div>
		<h1>Welcome Home</h1>
		<p>Select a page from the menu.</p>
	</div>
);

function App() {
	return (
		<BrowserRouter>
			{/* Wrapper to control layout */}
			<div className="app-layout">
				{/* Top Navbar */}
				<nav className="app-nav">
					<Link to="/">Home</Link>
					<Link to="/modules">Modules</Link>
				</nav>

				{/* Main Content Area */}
				<main className="app-content">
					<Routes>
						<Route path="/" element={<Home />} />
						<Route path="/modules" element={<Modules />} />
					</Routes>
				</main>
			</div>
		</BrowserRouter>
	);
}

export default App;
