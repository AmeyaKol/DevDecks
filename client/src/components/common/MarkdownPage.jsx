import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import Navbar from '../Navbar';

const MarkdownPage = ({ file }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(process.env.PUBLIC_URL + '/' + file)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load markdown file');
        return res.text();
      })
      .then((text) => {
        setContent(text);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [file]);

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center text-red-500 py-8">{error}</div>;

  return (
    <>
      <Navbar />
      <div className="prose dark:prose-invert max-w-3xl mx-auto py-8 px-4">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </>
  );
};

export default MarkdownPage; 