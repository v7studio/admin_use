import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import '../styles/Contacts.css';

const Contacts = () => {
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    const fetchContacts = async () => {
      const contactsCollectionRef = collection(db, 'contacts');
      const contactsSnapshot = await getDocs(contactsCollectionRef);
      const contactsList = contactsSnapshot.docs.map(doc => doc.data());
      setContacts(contactsList);
    };
    fetchContacts();
  }, []);

  return (
    <div className="contacts-container">
      <h2 className="contacts-header">Manage Contacts</h2>
      <div className="contacts-list">
        {contacts.map((contact, index) => (
          <div key={index} className="contact-card">
            <p><strong>Name:</strong> {contact.name}</p>
            <p><strong>Email:</strong> {contact.email}</p>
            <p><strong>Subject:</strong> {contact.subject}</p>
            <p><strong>Message:</strong> {contact.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Contacts;
