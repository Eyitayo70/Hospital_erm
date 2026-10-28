import React, { useState, useEffect } from 'react';
import { hospitalStore } from '../store/hospitalStore';
import { useToast } from '../components/Toast';
import { Patient, Department } from '../types';
import { DEPARTMENTS } from '../constants';
import { UserPlus, Edit, ArrowLeft, ShieldCheck, Check } from 'lucide-react';

interface PatientRegistrationViewProps {
  editPatientId?: number | null;
  onSuccess: (patientId: number) => void;
  onCancel: () => void;
}

export const PatientRegistrationView: React.FC<PatientRegistrationViewProps> = ({
  editPatientId,
  onSuccess,
  onCancel,
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<{
    first_name: string;
    last_name: string;
    phone: string;
    age: string;
    sex: string;
    blood_group: string;
    occupation: string;
    address: string;
    state_of_origin: string;
    religion: string;
    next_of_kin_name: string;
    next_of_kin_relationship: string;
    next_of_kin_phone: string;
    next_of_kin_address: string;
    department: Department;
    email: string;
    password: string;
    consent: boolean;
  }>({
    first_name: '',
    last_name: '',
    phone: '',
    age: '',
    sex: '',
    blood_group: '',
    occupation: '',
    address: '',
    state_of_origin: '',
    religion: '',
    next_of_kin_name: '',
    next_of_kin_relationship: '',
    next_of_kin_phone: '',
    next_of_kin_address: '',
    department: 'General',
    email: '',
    password: '',
    consent: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editPatientId) {
      const p = hospitalStore.getPatient(editPatientId);
      if (p) {
        setFormData({
          first_name: p.first_name || '',
          last_name: p.last_name || '',
          phone: p.phone || '',
          age: p.age ? String(p.age) : '',
          sex: p.sex || '',
          blood_group: p.blood_group || '',
          occupation: p.occupation || '',
          address: p.address || '',
          state_of_origin: p.state_of_origin || '',
          religion: p.religion || '',
          next_of_kin_name: p.next_of_kin_name || '',
          next_of_kin_relationship: p.next_of_kin_relationship || '',
          next_of_kin_phone: p.next_of_kin_phone || '',
          next_of_kin_address: p.next_of_kin_address || '',
          department: p.department || 'General',
          email: p.email || '',
          password: '',
          consent: true,
        });
      }
    }
  }, [editPatientId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      toast('First name and last name are required', true);
      return;
    }
    if (!editPatientId && !formData.consent) {
      toast('You must confirm patient consent before opening a folder', true);
      return;
    }
    if (formData.email && formData.password && formData.password.length < 6) {
      toast('Portal password must be at least 6 characters', true);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editPatientId) {
        const updated = hospitalStore.updatePatient(editPatientId, {
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          phone: formData.phone.trim() || undefined,
          age: formData.age ? Number(formData.age) : undefined,
          sex: formData.sex || undefined,
          blood_group: formData.blood_group || undefined,
          occupation: formData.occupation.trim() || undefined,
          address: formData.address.trim() || undefined,
          state_of_origin: formData.state_of_origin.trim() || undefined,
          religion: formData.religion.trim() || undefined,
          next_of_kin_name: formData.next_of_kin_name.trim() || undefined,
          next_of_kin_relationship: formData.next_of_kin_relationship.trim() || undefined,
          next_of_kin_phone: formData.next_of_kin_phone.trim() || undefined,
          next_of_kin_address: formData.next_of_kin_address.trim() || undefined,
          department: formData.department,
          email: formData.email.trim() || undefined,
        });
        toast('Folder details updated');
        onSuccess(updated.id);
      } else {
        const created = hospitalStore.createPatient({
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          phone: formData.phone.trim() || undefined,
          age: formData.age ? Number(formData.age) : undefined,
          sex: formData.sex || undefined,
          blood_group: formData.blood_group || undefined,
          occupation: formData.occupation.trim() || undefined,
          address: formData.address.trim() || undefined,
          state_of_origin: formData.state_of_origin.trim() || undefined,
          religion: formData.religion.trim() || undefined,
          next_of_kin_name: formData.next_of_kin_name.trim() || undefined,
          next_of_kin_relationship: formData.next_of_kin_relationship.trim() || undefined,
          next_of_kin_phone: formData.next_of_kin_phone.trim() || undefined,
          next_of_kin_address: formData.next_of_kin_address.trim() || undefined,
          department: formData.department,
          email: formData.email.trim() || undefined,
          password: formData.password || undefined,
          consent: formData.consent,
        });
        toast(`Folder opened — MRN ${created.mrn}`);
        onSuccess(created.id);
      }
    } catch (err: any) {
      toast(err.message || 'Operation failed', true);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="panel" style={{ maxWidth: 780 }}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          {editPatientId ? <Edit size={20} color="var(--teal)" /> : <UserPlus size={20} color="var(--manila-dark)" />}
          <h3 style={{ margin: 0 }}>
            {editPatientId ? 'Update Patient Demographics' : 'Patient Identity & Demographics'}
          </h3>
        </div>

        <div className="grid-2">
          <div className="field required">
            <label>First name</label>
            <input
              required
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            />
          </div>
          <div className="field required">
            <label>Last name</label>
            <input
              required
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            />
          </div>
        </div>

        <div className="grid-3">
          <div className="field">
            <label>Phone number</label>
            <input
              placeholder="0803-555-0100"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Age (years)</label>
            <input
              type="number"
              min="0"
              max="130"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Sex</label>
            <select
              value={formData.sex}
              onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
            >
              <option value="">Not specified</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
            </select>
          </div>
        </div>

        <div className="grid-2">
          <div className="field">
            <label>Blood group</label>
            <select
              value={formData.blood_group}
              onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
            >
              <option value="">Unknown</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>
          <div className="field">
            <label>Occupation</label>
            <input
              value={formData.occupation}
              onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
            />
          </div>
        </div>

        <div className="field">
          <label>Home Address</label>
          <input
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </div>

        <div className="grid-2">
          <div className="field">
            <label>State of origin</label>
            <input
              value={formData.state_of_origin}
              onChange={(e) => setFormData({ ...formData, state_of_origin: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Religion</label>
            <input
              value={formData.religion}
              onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
            />
          </div>
        </div>

        <hr className="section-divider" />
        <h3 style={{ marginBottom: 12 }}>Next of Kin Emergency Contact</h3>
        <div className="grid-2">
          <div className="field">
            <label>Next of kin's name</label>
            <input
              value={formData.next_of_kin_name}
              onChange={(e) => setFormData({ ...formData, next_of_kin_name: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Relationship</label>
            <input
              placeholder="e.g. Spouse, Parent, Sibling"
              value={formData.next_of_kin_relationship}
              onChange={(e) => setFormData({ ...formData, next_of_kin_relationship: e.target.value })}
            />
          </div>
        </div>

        <div className="grid-2">
          <div className="field">
            <label>Next of kin's phone number</label>
            <input
              value={formData.next_of_kin_phone}
              onChange={(e) => setFormData({ ...formData, next_of_kin_phone: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Next of kin's house address</label>
            <input
              value={formData.next_of_kin_address}
              onChange={(e) => setFormData({ ...formData, next_of_kin_address: e.target.value })}
            />
          </div>
        </div>

        <hr className="section-divider" />
        <h3 style={{ marginBottom: 12 }}>Administrative &amp; Admitting Department</h3>
        <div className="grid-2">
          <div className="field">
            <label>Primary admitting department</label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value as Department })}
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Email (optional — for patient portal access)</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
        </div>

        {!editPatientId && (
          <>
            <div className="field">
              <label>Portal password (optional — set if patient wants online access)</label>
              <input
                type="password"
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <p className="helper-text">
              Leave email and password blank if this patient will only access records physically at the front desk.
            </p>

            <div className="field" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'var(--paper-dim)', padding: '12px 14px', borderRadius: 4 }}>
              <input
                type="checkbox"
                id="consentCheck"
                style={{ width: 'auto', marginTop: 4 }}
                checked={formData.consent}
                onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                required
              />
              <label
                htmlFor="consentCheck"
                style={{
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '.85rem',
                  color: 'var(--ink)',
                  letterSpacing: 0,
                  cursor: 'pointer',
                  margin: 0,
                }}
              >
                I confirm this patient (or legal guardian) has consented to Wayfind General Hospital
                collecting and processing this clinical information for their care and official hospital records (WHO &amp; NDPR compliant).
              </label>
            </div>
          </>
        )}

        <div className="flex-between" style={{ marginTop: 20 }}>
          <button
            type="button"
            className="btn ghost"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button className="btn" type="submit" disabled={isSubmitting}>
            {editPatientId ? 'Save Changes' : 'Open Hospital Folder'}
          </button>
        </div>
      </form>
    </div>
  );
};
