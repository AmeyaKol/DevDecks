import React, { useState, useEffect } from 'react';
import useFlashcardStore from '../../store/flashcardStore';

const FolderForm = () => {
  const { addFolder, updateFolderStore, editingFolder, cancelEditFolder } = useFlashcardStore();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingFolder) {
      setName(editingFolder.name);
      setDescription(editingFolder.description || '');
      setIsPublic(editingFolder.isPublic);
    } else {
      setName('');
      setDescription('');
      setIsPublic(false);
    }
  }, [editingFolder]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const folderData = { name: name.trim(), description: description.trim(), isPublic };
      
      if (editingFolder) {
        await updateFolderStore(editingFolder._id, folderData);
      } else {
        await addFolder(folderData);
      }
      
      // Reset form
      setName('');
      setDescription('');
      setIsPublic(false);
    } catch (error) {
      console.error('Error submitting folder:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    cancelEditFolder();
    setName('');
    setDescription('');
    setIsPublic(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-6 lg:p-8 dark:bg-gray-800">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
        {editingFolder ? 'Edit Folder' : 'Create New Folder'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="folderName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Folder Name *
          </label>
          <input
            type="text"
            id="folderName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-amber-400"
            placeholder="Enter folder name"
            maxLength={100}
            required
          />
        </div>

        <div>
          <label htmlFor="folderDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            id="folderDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-amber-400"
            placeholder="Enter folder description (optional)"
            maxLength={500}
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isPublic"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
          />
          <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Make this folder public
          </label>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="flex-1 bg-amber-600 text-white py-2 px-4 rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isSubmitting ? 'Saving...' : (editingFolder ? 'Update Folder' : 'Create Folder')}
          </button>
          
          {editingFolder && (
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default FolderForm;




