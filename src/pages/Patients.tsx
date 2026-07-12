import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Search, Plus, UserPlus, Phone, Mail } from 'lucide-react';
import { mockPatients } from '@/data/mockDb';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'sonner';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, addDoc, doc, writeBatch } from 'firebase/firestore';
import { Patient } from '../types';

export function Patients() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  // Auto-seed if collection is empty
  const handleSeedPatients = async () => {
    try {
      const batch = writeBatch(db);
      const colRef = collection(db, 'patients');
      mockPatients.forEach((p) => {
        const docRef = doc(colRef, p.id);
        batch.set(docRef, p);
      });
      await batch.commit();
      console.log("Patients collection auto-seeded!");
    } catch (err) {
      console.error("Error seeding patients: ", err);
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'patients'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        handleSeedPatients();
        return;
      }
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Patient[];
      setPatients(fetched);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching patients: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const phone = formData.get('phone') as string;
    const preferredLanguage = formData.get('language') as string;

    try {
      await addDoc(collection(db, 'patients'), {
        firstName,
        lastName,
        phone,
        preferredLanguage,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
        birthDate: '1990-01-01',
        medicalNotes: '',
        status: 'Active',
        createdAt: new Date().toISOString()
      });
      setIsAddModalOpen(false);
      toast.success("Patient ajouté avec succès !");
    } catch (err) {
      console.error(err);
      toast.error("Échec de l'ajout du patient.");
    }
  };

  const filteredPatients = patients.filter(patient => 
    `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">CRM Patients</h1>
          <p className="mt-2 text-sm text-slate-600">
            Un répertoire complet de tous vos patients, de leur historique médical et de leurs interactions avec l'IA.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-x-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 animate-fade-in"
          >
            <UserPlus className="-ml-0.5 h-5 w-5" aria-hidden="true" />
            Ajouter un Patient
          </button>
        </div>
      </div>

      {/* Add Patient Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Ajouter un Nouveau Patient">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium leading-6 text-slate-900">Prénom</label>
              <div className="mt-2">
                <input type="text" name="firstName" id="firstName" required className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" />
              </div>
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium leading-6 text-slate-900">Nom</label>
              <div className="mt-2">
                <input type="text" name="lastName" id="lastName" required className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" />
              </div>
            </div>
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium leading-6 text-slate-900">Numéro de téléphone (WhatsApp)</label>
            <div className="mt-2">
              <input type="tel" name="phone" id="phone" required className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" />
            </div>
          </div>
          <div>
            <label htmlFor="language" className="block text-sm font-medium leading-6 text-slate-900">Langue préférée</label>
            <div className="mt-2">
              <select id="language" name="language" className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6">
                <option value="French">Français</option>
                <option value="Darija">Darija Marocain</option>
                <option value="Arabic">Arabe Classique</option>
                <option value="English">Anglais</option>
              </select>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-200 mt-6">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">Annuler</button>
            <button type="submit" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Enregistrer le Patient</button>
          </div>
        </form>
      </Modal>

      {/* Filters and Search */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="relative flex-1 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-slate-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border-0 py-1.5 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            placeholder="Rechercher des patients par nom ou téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Patient List Table */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow-sm ring-1 ring-slate-300 sm:rounded-lg">
              <table className="min-w-full divide-y divide-slate-300">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">
                      Nom
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">
                      Contact
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">
                      Langue
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">
                      Statut
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Voir</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 sm:pl-6">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                            {patient.firstName[0]}{patient.lastName[0]}
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-slate-900">{patient.firstName} {patient.lastName}</div>
                            <div className="text-slate-500 text-sm">Né(e) le : {patient.birthDate}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-slate-400" /> {patient.phone}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Mail className="h-3 w-3 text-slate-400" /> {patient.email}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                        {patient.preferredLanguage === 'French' ? 'Français' :
                         patient.preferredLanguage === 'Darija' ? 'Darija Marocain' :
                         patient.preferredLanguage === 'Arabic' ? 'Arabe Classique' : patient.preferredLanguage}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                          patient.status === 'Active' 
                            ? 'bg-green-50 text-green-700 ring-green-600/20'
                            : 'bg-slate-50 text-slate-700 ring-slate-600/20'
                        }`}>
                          {patient.status === 'Active' ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <Link to={`/patients/${patient.id}`} className="text-blue-600 hover:text-blue-900 font-bold">
                          Voir le profil<span className="sr-only">, {patient.firstName} {patient.lastName}</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {filteredPatients.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-sm text-slate-500">
                        Aucun patient trouvé correspondant à votre recherche.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
