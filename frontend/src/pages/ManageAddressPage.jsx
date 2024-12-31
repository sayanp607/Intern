import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import {
  FaHome,
  FaRegHeart,
  FaHeart,
  FaUserFriends,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { MdLocalPostOffice } from "react-icons/md";

// Map Preview Modal Component
const MapPreviewModal = ({ isOpen, address, onClose }) => {
  if (!isOpen || !address) return null;

  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <h3>
          Map Preview for {address.houseNumber}, {address.roadArea}
        </h3>
        <div style={styles.mapContainer}>
          <iframe
            title="Map Preview"
            width="100%"
            height="400"
            frameBorder="0"
            style={{ border: 0 }}
            src={`https://www.google.com/maps?q=${address.latitude},${address.longitude}&z=15&output=embed`}
          />
        </div>
        <button onClick={onClose} style={styles.closeButton}>
          Close
        </button>
      </div>
    </div>
  );
};

const ManageAddressPage = () => {
  const [addresses, setAddresses] = useState([]);
  const [filteredAddresses, setFilteredAddresses] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState(() => {
    const savedSearches = localStorage.getItem("recentSearches");
    return savedSearches ? JSON.parse(savedSearches) : [];
  });
  const [isMapPreviewOpen, setIsMapPreviewOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const res = await axiosInstance.get("/addresses");
      setAddresses(res.data);
      setFilteredAddresses(res.data); // Initialize filtered list
    } catch (error) {
      alert("Failed to fetch addresses. Please try again.");
    }
  };

  const toggleFavorite = async (id) => {
    try {
      await axiosInstance.put(`/addresses/${id}/favorite`);
      fetchAddresses(); // Refresh the list to reflect updated favorite status
    } catch (error) {
      alert("Failed to update favorite status.");
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addRecentSearch(searchQuery.trim());
      filterAddresses(searchQuery);
      setSearchQuery(""); // Clear the search bar after submitting
    }
  };

  const addRecentSearch = (query) => {
    if (query !== "") {
      const updatedSearches = [query, ...recentSearches].slice(0, 5);
      setRecentSearches(updatedSearches);
      localStorage.setItem("recentSearches", JSON.stringify(updatedSearches));
    }
  };

  const filterAddresses = (query) => {
    const filtered = addresses.filter(
      (address) =>
        address.houseNumber.toLowerCase().includes(query.toLowerCase()) ||
        address.roadArea.toLowerCase().includes(query.toLowerCase()) ||
        address.category.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredAddresses(filtered);
  };

  const handleSavedLocationClick = (address) => {
    const query = `${address.houseNumber}, ${address.roadArea} (${address.category})`;
    setSearchQuery(query);
    addRecentSearch(query);
    filterAddresses(query);
  };

  const handleViewFavorites = () => {
    navigate("/favorites"); // Navigate to the Favorites Page
  };

  const handleMapPreview = (address) => {
    setSelectedAddress(address);
    setIsMapPreviewOpen(true);
  };

  const closeMapPreview = () => {
    setIsMapPreviewOpen(false);
    setSelectedAddress(null);
  };

  const categorizeAddresses = (addresses) => {
    return {
      home: addresses.filter((addr) => addr.category.toLowerCase() === "home"),
      office: addresses.filter(
        (addr) => addr.category.toLowerCase() === "office"
      ),
      familyAndFriends: addresses.filter(
        (addr) => addr.category.toLowerCase() === "family & friends"
      ),
      other: addresses.filter(
        (addr) =>
          addr.category.toLowerCase() !== "home" &&
          addr.category.toLowerCase() !== "office" &&
          addr.category.toLowerCase() !== "family & friends"
      ),
    };
  };

  const categorizedAddresses = categorizeAddresses(filteredAddresses);

  return (
    <div>
      <h2>Saved Locations</h2>
      {/* View Favorites Button */}
      <button onClick={handleViewFavorites} style={styles.viewFavoritesButton}>
        View Favorites
      </button>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search your area/pincode/apartment..."
        value={searchQuery}
        onChange={handleSearchChange}
        onKeyDown={handleSearchSubmit} // Listen for Enter key
        style={styles.searchBar}
      />

      {/* Categorized Address List */}
      {Object.entries(categorizedAddresses).map(([category, addresses]) => (
        <div key={category} style={styles.categorySection}>
          <h3 style={styles.categoryTitle}>
            {category === "home" && <FaHome style={styles.icon} />}
            {category === "office" && <MdLocalPostOffice style={styles.icon} />}
            {category === "familyAndFriends" && (
              <FaUserFriends style={styles.icon} />
            )}
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </h3>
          {addresses.length > 0 ? (
            <ul>
              {addresses.map((address) => (
                <li
                  key={address._id}
                  style={styles.addressItem}
                  onClick={() => handleSavedLocationClick(address)}
                >
                  <p>
                    {address.houseNumber}, {address.roadArea}
                  </p>
                  <p>
                    Latitude: {address.latitude}, Longitude: {address.longitude}
                  </p>
                  <button
                    style={styles.favoriteButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(address._id);
                    }}
                  >
                    {address.isFavorite ? (
                      <FaHeart style={styles.favoriteIcon} />
                    ) : (
                      <FaRegHeart style={styles.favoriteIcon} />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMapPreview(address); // Open map preview
                    }}
                    style={styles.mapPreviewButton}
                  >
                    Map Preview
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No addresses in this category.</p>
          )}
        </div>
      ))}

      {/* Recent Searches */}
      <div style={styles.recentSearches}>
        <h3 style={styles.recentTitle}>Recent Searches</h3>
        {recentSearches.length > 0 ? (
          <ul>
            {recentSearches.map((search, index) => (
              <li key={index} style={styles.recentItem}>
                <FaMapMarkerAlt style={styles.mapIcon} />
                {search}
              </li>
            ))}
          </ul>
        ) : (
          <p>No recent searches.</p>
        )}
      </div>

      {/* Map Preview Modal */}
      <MapPreviewModal
        isOpen={isMapPreviewOpen}
        address={selectedAddress}
        onClose={closeMapPreview}
      />
    </div>
  );
};

const styles = {
  searchBar: {
    padding: "10px",
    width: "100%",
    marginBottom: "20px",
    fontSize: "16px",
    border: "1px solid #ddd",
    borderRadius: "5px",
  },
  viewFavoritesButton: {
    padding: "10px 20px",
    fontSize: "16px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    marginBottom: "20px",
  },
  categorySection: {
    marginBottom: "20px",
    padding: "10px",
    backgroundColor: "#f9f9f9",
    border: "1px solid #ddd",
    borderRadius: "8px",
  },
  categoryTitle: {
    fontSize: "20px",
    marginBottom: "10px",
    textTransform: "capitalize",
    display: "flex",
    alignItems: "center",
  },
  icon: {
    marginRight: "10px",
    fontSize: "24px",
    color: "#007bff",
  },
  addressItem: {
    marginBottom: "10px",
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "5px",
    backgroundColor: "#fff",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  favoriteButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
  },
  favoriteIcon: {
    fontSize: "20px",
    color: "#ff5722",
  },
  mapPreviewButton: {
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    padding: "5px 10px",
    borderRadius: "5px",
    cursor: "pointer",
  },
  recentSearches: {
    marginTop: "30px",
    padding: "10px",
    backgroundColor: "#f9f9f9",
    border: "1px solid #ddd",
    borderRadius: "8px",
  },
  recentTitle: {
    fontSize: "20px",
    marginBottom: "10px",
  },
  recentItem: {
    display: "flex",
    alignItems: "center",
    marginBottom: "10px",
    fontSize: "16px",
  },
  mapIcon: {
    marginRight: "10px",
    fontSize: "20px",
    color: "#28a745",
  },
  // Modal Styles
  modal: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "10px",
    width: "80%",
    maxWidth: "800px",
    textAlign: "center",
  },
  mapContainer: {
    marginBottom: "20px",
  },
  closeButton: {
    padding: "10px 20px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

export default ManageAddressPage;
