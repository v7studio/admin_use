import React, { useState, useEffect } from 'react';
import { storage, db } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import '../styles/GalleryManager.css';

const CHUNK_SIZE = 256 * 1024; // 256 KB

const GalleryManager = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState('');
  const [images, setImages] = useState([]);
  const [category, setCategory] = useState('Wedding');
  const [selectedImages, setSelectedImages] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editImage, setEditImage] = useState(null);

  const categories = ['Wedding', 'College Events', 'Birthday Events', 'Nature'];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = () => {
    if (!file) return;

    const storageRef = ref(storage, `gallery/${category}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(progress);
      },
      (error) => {
        console.error("Error uploading file:", error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

        // Convert the image file to a base64 string and split it into chunks
        const fileReader = new FileReader();
        fileReader.onload = async () => {
          const base64Data = fileReader.result.split(',')[1]; // Remove the data URL prefix
          const chunks = [];
          for (let i = 0; i < base64Data.length; i += CHUNK_SIZE) {
            chunks.push(base64Data.substring(i, i + CHUNK_SIZE));
          }

          // Store each chunk in Firestore
          const chunkCollectionRef = collection(db, 'gallery_chunks');
          const chunkIds = [];
          for (let i = 0; i < chunks.length; i++) {
            const chunkDocRef = await addDoc(chunkCollectionRef, {
              chunkData: chunks[i],
              index: i,
              totalChunks: chunks.length,
              category: category,
              fileName: file.name
            });
            chunkIds.push(chunkDocRef.id);
          }

          // Store the image metadata with chunk IDs in Firestore
          await addDoc(collection(db, 'gallery'), {
            url: downloadURL,
            name: file.name,
            category: category,
            chunkIds: chunkIds,
          });

          setSuccess('Image uploaded successfully!');
          setFile(null);
          setPreview(null);
          setProgress(0);
          fetchImages(); // Fetch the updated list of images
        };
        fileReader.readAsDataURL(file);
      }
    );
  };

  const fetchImages = async () => {
    const imagesCollection = await getDocs(collection(db, 'gallery'));
    setImages(imagesCollection.docs.map(doc => ({ ...doc.data(), id: doc.id })));
  };

  const handleEdit = (image) => {
    setEditMode(true);
    setEditImage(image);
    setFile(null);
    setPreview(image.url);
    setCategory(image.category);
  };

  const handleUpdate = async () => {
    if (!editImage) return;

    if (file) {
      const storageRef = ref(storage, `gallery/${category}/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(progress);
        },
        (error) => {
          console.error("Error uploading file:", error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Convert the image file to base64 and split into chunks
          const fileReader = new FileReader();
          fileReader.onload = async () => {
            const base64Data = fileReader.result.split(',')[1]; // Remove the data URL prefix
            const chunks = [];
            for (let i = 0; i < base64Data.length; i += CHUNK_SIZE) {
              chunks.push(base64Data.substring(i, i + CHUNK_SIZE));
            }

            // Update chunks in Firestore
            const chunkCollectionRef = collection(db, 'gallery_chunks');
            const chunkIds = [];
            for (let i = 0; i < chunks.length; i++) {
              const chunkDocRef = await addDoc(chunkCollectionRef, {
                chunkData: chunks[i],
                index: i,
                totalChunks: chunks.length,
                category: category,
                fileName: file.name
              });
              chunkIds.push(chunkDocRef.id);
            }

            // Update the image metadata in Firestore
            await updateDoc(doc(db, 'gallery', editImage.id), {
              url: downloadURL,
              name: file.name,
              category: category,
              chunkIds: chunkIds,
            });

            setSuccess('Image updated successfully!');
            setFile(null);
            setPreview(null);
            setProgress(0);
            setEditMode(false);
            setEditImage(null);
            fetchImages();
          };
          fileReader.readAsDataURL(file);
        }
      );
    } else {
      await updateDoc(doc(db, 'gallery', editImage.id), {
        category: category
      });
      setSuccess('Image category updated successfully!');
      setEditMode(false);
      setEditImage(null);
      fetchImages();
    }
  };

  const handleDelete = async (image) => {
    if (!image || !image.category || !image.name) {
      console.error('Invalid image data:', image);
      return;
    }

    if (!window.confirm('Are you sure you want to delete this image?')) return;

    try {
      const imageRef = ref(storage, `gallery/${image.category}/${image.name}`);
      await deleteObject(imageRef);

      // Delete the chunks from Firestore
      if (image.chunkIds && image.chunkIds.length > 0) {
        for (const chunkId of image.chunkIds) {
          await deleteDoc(doc(db, 'gallery_chunks', chunkId));
        }
      }

      await deleteDoc(doc(db, 'gallery', image.id));
      setSuccess('Image deleted successfully!');
      fetchImages();
    } catch (error) {
      console.error("Error deleting image:", error);
    }
  };

  const handleMultiDelete = async () => {
    if (!window.confirm('Are you sure you want to delete selected images?')) return;

    try {
      for (const image of selectedImages) {
        const imageRef = ref(storage, `gallery/${image.category}/${image.name}`);
        await deleteObject(imageRef);

        // Delete the chunks from Firestore
        if (image.chunkIds && image.chunkIds.length > 0) {
          for (const chunkId of image.chunkIds) {
            await deleteDoc(doc(db, 'gallery_chunks', chunkId));
          }
        }

        await deleteDoc(doc(db, 'gallery', image.id));
      }
      setSuccess('Selected images deleted successfully!');
      setSelectedImages([]);
      fetchImages();
    } catch (error) {
      console.error("Error deleting images:", error);
    }
  };

  const handleSelectImage = (image) => {
    setSelectedImages((prevSelected) =>
      prevSelected.includes(image)
        ? prevSelected.filter((i) => i !== image)
        : [...prevSelected, image]
    );
  };

  useEffect(() => {
    fetchImages(); // Fetch images on component mount
  }, []);

  return (
    <div className="gallery-container">
      <h2 className="gallery-header">Manage Gallery</h2>
      <div className="category-section">
        <label>Category:</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((cat, index) => (
            <option key={index} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      <div className="upload-section">
        <label className="upload-label">
          <input type="file" onChange={handleFileChange} />
          <div className="upload-placeholder">
            {preview ? <img src={preview} alt="preview" /> : '+'}
          </div>
        </label>
        <button onClick={editMode ? handleUpdate : handleUpload} disabled={!file && !editMode} className="upload-button">
          {editMode ? 'Update Image' : 'Upload Image'}
        </button>
        {editMode && <button onClick={() => { setEditMode(false); setEditImage(null); setPreview(null); }} className="cancel-button">Cancel</button>}
      </div>
      {progress > 0 && <div className="progress-bar"><div style={{ width: `${progress}%` }}></div></div>}
      {success && <p className="success-message">{success}</p>}

      {selectedImages.length > 0 && (
        <div className="multi-delete-section">
          <button onClick={handleMultiDelete} className="delete-button">Delete Selected</button>
        </div>
      )}

      <div className="images-section">
        {images
          .filter(image => image.category === category)
          .map((image, index) => (
          <div key={index} className={`image-card ${selectedImages.includes(image) ? 'selected' : ''}`} onClick={() => handleSelectImage(image)}>
            <input
              type="checkbox"
              className="select-checkbox"
              checked={selectedImages.includes(image)}
              onChange={() => handleSelectImage(image)}
            />
            <img src={image.url} alt={image.name} />
            <p>{image.name}</p>
            <p className="category-label">{image.category}</p>
            <div className="image-actions">
              <button onClick={() => handleEdit(image)} className="edit-button">Edit</button>
              <button onClick={() => handleDelete(image)} className="delete-button">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GalleryManager;
