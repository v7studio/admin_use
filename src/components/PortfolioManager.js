import React, { useState, useEffect } from 'react';
import { storage, db } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, getDoc } from "firebase/firestore";
import '../styles/PortfolioManager.css';

const PortfolioManager = () => {
  const [mainFile, setMainFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [mainPreview, setMainPreview] = useState(null);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState('');
  const [portfolios, setPortfolios] = useState([]);
  const [clientName, setClientName] = useState('');
  const [editPortfolioId, setEditPortfolioId] = useState(null);
  const [existingGalleryImages, setExistingGalleryImages] = useState([]);

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const handleMainFileChange = (e) => {
    const file = e.target.files[0];
    setMainFile(file);
    setMainPreview(URL.createObjectURL(file));
  };

  const handleGalleryFilesChange = (e) => {
    const files = Array.from(e.target.files);
    setGalleryFiles(files);
  };

  const handleUpload = async () => {
    if (!clientName) return;

    try {
      let mainImageUrl;

      // Upload main image if provided
      if (mainFile) {
        mainImageUrl = await uploadFile(mainFile, `portfolio/${clientName}/main/${mainFile.name}`);
      } else if (editPortfolioId) {
        const currentPortfolio = portfolios.find(p => p.id === editPortfolioId);
        mainImageUrl = currentPortfolio.mainImageUrl;
      }

      // Upload new gallery images if provided
      const galleryImageUrls = await uploadGalleryImages(clientName, galleryFiles);

      // Updated portfolio data
      const updatedPortfolioData = {
        clientName,
        mainImageUrl,
        galleryImages: [...existingGalleryImages, ...galleryImageUrls],
      };

      if (editPortfolioId) {
        await handleEditPortfolio(editPortfolioId, updatedPortfolioData);
        setEditPortfolioId(null);
      } else {
        await addDoc(collection(db, 'portfolios'), updatedPortfolioData);
      }

      setSuccess('Portfolio uploaded successfully!');
      resetForm();
      fetchPortfolios();
    } catch (error) {
      console.error("Error uploading portfolio:", error);
    }
  };

  const uploadFile = (file, storagePath) => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(progress);
        },
        (error) => reject(error),
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  const uploadGalleryImages = async (clientName, files) => {
    const uploadPromises = files.map((file) => {
      const storagePath = `portfolio/${clientName}/gallery/${file.name}`;
      return uploadFile(file, storagePath);
    });

    return Promise.all(uploadPromises);
  };

  const fetchPortfolios = async () => {
    const portfoliosCollection = await getDocs(collection(db, 'portfolios'));
    const portfoliosData = portfoliosCollection.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    setPortfolios(portfoliosData);
  };

  const handleDeletePortfolio = async (portfolio) => {
    if (!portfolio || !portfolio.clientName) return;

    if (!window.confirm('Are you sure you want to delete this portfolio?')) return;

    try {
      await deleteFile(`portfolio/${portfolio.clientName}/main/${extractFileName(portfolio.mainImageUrl)}`);
      
      if (portfolio.galleryImages) {
        for (let galleryImageUrl of portfolio.galleryImages) {
          await deleteFile(`portfolio/${portfolio.clientName}/gallery/${extractFileName(galleryImageUrl)}`);
        }
      }

      await deleteDoc(doc(db, 'portfolios', portfolio.id));
      setSuccess('Portfolio deleted successfully!');
      fetchPortfolios();
    } catch (error) {
      console.error("Error deleting portfolio:", error);
    }
  };

  const deleteFile = (storagePath) => {
    const fileRef = ref(storage, storagePath);
    return deleteObject(fileRef);
  };

  const extractFileName = (url) => {
    const decodedUrl = decodeURIComponent(url);
    return decodedUrl.split('/').pop().split('?')[0];
  };

  const resetForm = () => {
    setMainFile(null);
    setGalleryFiles([]);
    setMainPreview(null);
    setProgress(0);
    setClientName('');
    setEditPortfolioId(null);
    setExistingGalleryImages([]);
  };

  const handleEditClick = (portfolio) => {
    setClientName(portfolio.clientName);
    setMainPreview(portfolio.mainImageUrl);
    setEditPortfolioId(portfolio.id);
    setExistingGalleryImages(portfolio.galleryImages || []);
    setGalleryFiles([]);
  };

  const handleEditPortfolio = async (portfolioId, updatedData) => {
    const portfolioDocRef = doc(db, 'portfolios', portfolioId);
    await updateDoc(portfolioDocRef, updatedData);
    setSuccess('Portfolio updated successfully!');
    fetchPortfolios();
  };

  const handleDeleteGalleryImage = async (portfolioId, clientName, imageUrl) => {
    try {
      const fileName = extractFileName(imageUrl);
      const storagePath = `portfolio/${clientName}/gallery/${fileName}`;
  
      // Delete the image from Firebase Storage
      await deleteFile(storagePath);
  
      // Retrieve the portfolio document to get the existing gallery images
      const portfolioDocRef = doc(db, 'portfolios', portfolioId);
      const docSnapshot = await getDoc(portfolioDocRef);
  
      if (docSnapshot.exists()) {
        const portfolioData = docSnapshot.data();
        const updatedGalleryImages = portfolioData.galleryImages.filter(url => url !== imageUrl);
  
        // Update Firestore document to remove the deleted image URL
        await updateDoc(portfolioDocRef, { galleryImages: updatedGalleryImages });
  
        // Update local state to reflect the deletion
        setExistingGalleryImages(updatedGalleryImages);
        setSuccess('Image deleted successfully!');
      }
    } catch (error) {
      console.error("Error deleting gallery image:", error);
    }
  };
  

  return (
    <div className="portfolio-container">
      <h2 className="portfolio-header">Manage Wedding Portfolios</h2>
      <div className="client-section">
        <label>Client Name:</label>
        <input 
          type="text" 
          value={clientName} 
          onChange={(e) => setClientName(e.target.value)} 
          placeholder="Enter Client Name" 
        />
      </div>
      <div className="upload-section">
        <label>Main Image (Thumbnail):</label>
        <label className="upload-label">
          <input type="file" onChange={handleMainFileChange} />
          <div className="upload-placeholder">
            {mainPreview ? <img src={mainPreview} alt="preview" /> : '+'}
          </div>
        </label>
      </div>
      <div className="upload-section">
        <label>Gallery Images:</label>
        <label className="upload-label">
          <input type="file" onChange={handleGalleryFilesChange} multiple />
          <div className="upload-placeholder">
            {galleryFiles.length > 0 ? `${galleryFiles.length} file(s) selected` : '+'}
          </div>
        </label>
      </div>
      <button onClick={handleUpload} disabled={!clientName} className="upload-button">
        {editPortfolioId ? 'Update Portfolio' : 'Upload Portfolio'}
      </button>
      {progress > 0 && <div className="progress-bar"><div style={{ width: `${progress}%` }}></div></div>}
      {success && <p className="success-message">{success}</p>}

      <div className="portfolios-section">
        {portfolios.map((portfolio, index) => (
          <div key={index} className="portfolio-card">
            <img src={portfolio.mainImageUrl} alt={portfolio.clientName} className="main-image" />
            <h3>{portfolio.clientName}</h3>
            <button onClick={() => handleEditClick(portfolio)} className="edit-button">Edit Portfolio</button>
            <button onClick={() => handleDeletePortfolio(portfolio)} className="delete-button">Delete Portfolio</button>
            <div className="gallery-images">
              {portfolio.galleryImages.map((imageUrl, i) => (
                <div key={i} className="gallery-image-item">
                  <img src={imageUrl} alt={`gallery-${i}`} className="gallery-image" />
                  <button 
                    onClick={() => handleDeleteGalleryImage(portfolio.id, portfolio.clientName, imageUrl)} 
                    className="delete-gallery-button"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PortfolioManager;
