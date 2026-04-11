import Header from "../components/Header";
import Navbar from "../components/Navbar";

export default function UserLayout({ children }) {
  return (
    <div>
      <Header />
      <Navbar />
      <main style={{ padding: "20px" }}>{children}</main>
    </div>
  );
}