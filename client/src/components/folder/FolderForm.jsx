import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import useFlashcardStore from '../../store/flashcardStore';
import { folderSchema } from '../../utils/validationSchemas';

const FolderForm = () => {
  const { addFolder, updateFolderStore, editingFolder, cancelEditFolder } = useFlashcardStore();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(folderSchema),
    defaultValues: {
      name: '',
      description: '',
      isPublic: false,
    },
  });

  const folderName = watch('name');
  const isPublic = watch('isPublic');

  useEffect(() => {
    if (editingFolder) {
      reset({
        name: editingFolder.name || '',
        description: editingFolder.description || '',
        isPublic: !!editingFolder.isPublic,
      });
    } else {
      reset({
        name: '',
        description: '',
        isPublic: false,
      });
    }
  }, [editingFolder, reset]);

  const onSubmit = async (values) => {
    try {
      const folderData = {
        name: values.name.trim(),
        description: (values.description || '').trim(),
        isPublic: !!values.isPublic,
      };
      
      if (editingFolder) {
        await updateFolderStore(editingFolder._id, folderData);
      } else {
        await addFolder(folderData);
      }
      
      // Reset form
      reset({
        name: '',
        description: '',
        isPublic: false,
      });
    } catch (error) {
      console.error('Error submitting folder:', error);
    }
  };

  const handleCancel = () => {
    cancelEditFolder();
    reset({
      name: '',
      description: '',
      isPublic: false,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-6 lg:p-8 dark:bg-gray-800">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
        {editingFolder ? 'Edit Folder' : 'Create New Folder'}
      </h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="folderName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Folder Name *
          </label>
          <input
            type="text"
            id="folderName"
            {...register('name')}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-amber-400"
            placeholder="Enter folder name"
            maxLength={100}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="folderDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            id="folderDescription"
            rows={3}
            {...register('description')}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-amber-400"
            placeholder="Enter folder description (optional)"
            maxLength={500}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isPublic"
            {...register('isPublic')}
            checked={!!isPublic}
            onChange={(e) => setValue('isPublic', e.target.checked, { shouldValidate: true })}
            className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
          />
          <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Make this folder public
          </label>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting || !folderName?.trim()}
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




