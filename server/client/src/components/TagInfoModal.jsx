import { useState, useEffect } from 'react';
import { HiOutlineInformationCircle, HiOutlineXMark, HiOutlineBookOpen } from 'react-icons/hi2';

function TagInfoModal({ tag, onClose }) {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTagInfo = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetching summary from Wikipedia API
        const response = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(tag)}`
        );
        if (!response.ok) throw new Error('Topic information not found');
        const data = await response.json();
        setInfo({
          title: data.title,
          description: data.description,
          extract: data.extract,
          thumbnail: data.thumbnail?.source,
          link: data.content_urls?.desktop?.page,
        });
      } catch (err) {
        setError("We couldn't find detailed information for this specific tag, but it's a great topic to explore!");
      } finally {
        setLoading(false);
      }
    };

    if (tag) fetchTagInfo();
  }, [tag]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card tag-info-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}><HiOutlineXMark /></button>
        
        <div className="tag-info-header">
          <HiOutlineInformationCircle className="tag-info-icon" />
          <h3>Topic Spotlight: {tag}</h3>
        </div>

        <div className="tag-info-body">
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Fetching insights...</p>
            </div>
          ) : error ? (
            <div className="tag-info-error">
              <p>{error}</p>
            </div>
          ) : (
            <div className="tag-info-content">
              {info.thumbnail && <img src={info.thumbnail} alt={info.title} className="tag-info-image" />}
              {info.description && <p className="tag-info-desc">{info.description}</p>}
              <p className="tag-info-extract">{info.extract}</p>
              <a href={info.link} target="_blank" rel="noopener noreferrer" className="btn btn-secondary tag-info-link">
                <HiOutlineBookOpen /> Read more on Wikipedia
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TagInfoModal;
