import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { projectApi } from '../../api/projectApi';
import { userApi } from '../../api/userApi';
import { useToast } from '../../context/ToastContext';
import { FolderPlus } from 'lucide-react';

export function CreateProjectModal({ isOpen, onClose, onProjectCreated }) {
  const { success, error } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    projectKey: '',
    description: '',
    managerId: '',
  });
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      userApi.getEligibleProjectManagers()
        .then((data) => {
          setManagers(data || []);
          if (data && data.length > 0) {
            setFormData((prev) => ({ ...prev, managerId: data[0].id }));
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'projectKey') {
      setFormData((prev) => ({ ...prev, [name]: value.toUpperCase() }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    const errors = {};
    if (!formData.name.trim()) errors.name = 'Project name is required';
    if (!formData.projectKey.trim()) errors.projectKey = 'Project key is required';
    else if (!/^[A-Z0-9]{2,10}$/.test(formData.projectKey.trim())) {
      errors.projectKey = 'Project key must be 2-10 uppercase alphanumeric characters (e.g. PROJ)';
    }
    if (!formData.managerId) errors.managerId = 'Please select a project manager';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const created = await projectApi.createProject({
        name: formData.name.trim(),
        projectKey: formData.projectKey.trim(),
        description: formData.description.trim() || undefined,
        managerId: Number(formData.managerId),
      });
      success(`Project "${created.name}" (${created.projectKey}) created successfully!`);
      setFormData({ name: '', projectKey: '', description: '', managerId: '' });
      if (onProjectCreated) onProjectCreated(created);
      onClose();
    } catch (err) {
      if (err.validationErrors) {
        setFieldErrors(err.validationErrors);
      } else {
        error(err.message || 'Failed to create project');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? () => {} : onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FolderPlus size={20} color="var(--primary-600)" />
          <span>Create New Project</span>
        </div>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="project-name">Project Name</label>
          <input
            id="project-name"
            type="text"
            name="name"
            className="form-control"
            placeholder="e.g. Core Billing Platform"
            value={formData.name}
            onChange={handleChange}
            disabled={loading}
            required
          />
          {fieldErrors.name && <div className="form-error">{fieldErrors.name}</div>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="project-key">Project Key (Prefix)</label>
          <input
            id="project-key"
            type="text"
            name="projectKey"
            className="form-control"
            placeholder="e.g. BILL"
            maxLength={10}
            value={formData.projectKey}
            onChange={handleChange}
            disabled={loading}
            required
          />
          <div className="form-hint">2-10 uppercase characters. Used as issue prefix (e.g. BILL-1, BILL-2)</div>
          {fieldErrors.projectKey && <div className="form-error">{fieldErrors.projectKey}</div>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="project-manager">Project Manager</label>
          <select
            id="project-manager"
            name="managerId"
            className="form-control"
            value={formData.managerId}
            onChange={handleChange}
            disabled={loading}
            required
          >
            <option value="">Select an active project manager</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.firstName} {m.lastName} ({m.email})
              </option>
            ))}
          </select>
          {fieldErrors.managerId && <div className="form-error">{fieldErrors.managerId}</div>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="project-desc">Description</label>
          <textarea
            id="project-desc"
            name="description"
            className="form-control"
            rows={3}
            placeholder="Optional project scope and details..."
            value={formData.description}
            onChange={handleChange}
            disabled={loading}
          />
          {fieldErrors.description && <div className="form-error">{fieldErrors.description}</div>}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  );
}

CreateProjectModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onProjectCreated: PropTypes.func,
};
