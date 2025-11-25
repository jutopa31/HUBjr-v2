import React, { useEffect, useState } from 'react';
import TopicStatistics from './TopicStatistics';
import TopicsList from './TopicsList';
import EditTopicModal from './EditTopicModal';
import ManualPointsModal from './ManualPointsModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import {
  getAllTopics,
  getTopicStatistics,
  updateTopic,
  deleteTopic,
  type Topic,
  type TopicStatistics as TopicStatisticsType
} from '../../services/rankingService';

type TabType = 'published' | 'draft' | 'closed';

type Props = {
  onTopicsChanged?: () => void;
};

const AdminTopicsPanel: React.FC<Props> = ({ onTopicsChanged }) => {
  const [activeTab, setActiveTab] = useState<TabType>('published');
  const [allTopics, setAllTopics] = useState<{ published: Topic[], draft: Topic[], closed: Topic[] }>({
    published: [],
    draft: [],
    closed: []
  });
  const [statistics, setStatistics] = useState<TopicStatisticsType | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const loadAllData = async (notifyParent = false) => {
    setLoading(true);
    try {
      const [topics, stats] = await Promise.all([
        getAllTopics(),
        getTopicStatistics(),
      ]);
      setAllTopics(topics);
      setStatistics(stats);
      // Notificar al padre solo si se solicita (después de cambios)
      if (notifyParent) {
        onTopicsChanged?.();
      }
    } catch (error) {
      console.error('Error loading admin panel data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData(false); // No notificar en la carga inicial
  }, []);

  const handleEdit = (topic: Topic) => {
    setSelectedTopic(topic);
    setShowEditModal(true);
  };

  const handleAddPoints = (topic: Topic) => {
    setSelectedTopic(topic);
    setShowPointsModal(true);
  };

  const handleDelete = (topic: Topic) => {
    setSelectedTopic(topic);
    setShowDeleteModal(true);
  };

  const handleClose = async (topic: Topic) => {
    if (confirm(`¿Cerrar el tema "${topic.title}" anticipadamente?`)) {
      const { success } = await updateTopic(topic.id, { status: 'closed' });
      if (success) {
        await loadAllData(true); // Notificar al padre
      }
    }
  };

  const handleSaveEdit = async (topicId: string, updates: any) => {
    const { success } = await updateTopic(topicId, updates);
    if (success) {
      setShowEditModal(false);
      setSelectedTopic(null);
      await loadAllData(true); // Notificar al padre
    }
    return success;
  };

  const handleConfirmDelete = async () => {
    if (!selectedTopic) return;
    const { success } = await deleteTopic(selectedTopic.id);
    if (success) {
      setShowDeleteModal(false);
      setSelectedTopic(null);
      await loadAllData(true); // Notificar al padre
    }
  };

  const handlePointsSuccess = async () => {
    setShowPointsModal(false);
    setSelectedTopic(null);
    await loadAllData(false); // No notificar (puntos no afectan temas activos)
  };

  const getCurrentTopics = () => {
    return allTopics[activeTab] || [];
  };

  return (
    <div className="space-y-6">
      {/* Statistics Section */}
      <section className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Estadísticas del Ranking
        </h2>
        <TopicStatistics statistics={statistics} loading={loading} />
      </section>

      {/* Topics Management Section */}
      <section className="rounded-lg border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-[#1f1f1f] p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-indigo-700 dark:text-indigo-300 mb-4">
          Gestión de Temas
        </h2>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            onClick={() => setActiveTab('published')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'published'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300'
            }`}
          >
            Activos ({allTopics.published.length})
          </button>
          <button
            onClick={() => setActiveTab('draft')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'draft'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300'
            }`}
          >
            Borradores ({allTopics.draft.length})
          </button>
          <button
            onClick={() => setActiveTab('closed')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'closed'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300'
            }`}
          >
            Cerrados ({allTopics.closed.length})
          </button>
        </div>

        {/* Topics List */}
        {loading ? (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">
            Cargando temas...
          </div>
        ) : (
          <TopicsList
            topics={getCurrentTopics()}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddPoints={handleAddPoints}
            onClose={handleClose}
            showCloseButton={activeTab === 'published'}
          />
        )}
      </section>

      {/* Modals */}
      {showEditModal && selectedTopic && (
        <EditTopicModal
          topic={selectedTopic}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTopic(null);
          }}
          onSave={handleSaveEdit}
        />
      )}

      {showPointsModal && selectedTopic && (
        <ManualPointsModal
          topic={selectedTopic}
          onClose={() => {
            setShowPointsModal(false);
            setSelectedTopic(null);
          }}
          onSuccess={handlePointsSuccess}
        />
      )}

      {showDeleteModal && selectedTopic && (
        <DeleteConfirmModal
          topicTitle={selectedTopic.title}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedTopic(null);
          }}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
};

export default AdminTopicsPanel;
