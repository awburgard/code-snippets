import { useQuery } from '@tanstack/react-query';

// Constants
const IS_PROD_ENV = window.location.hostname === 'REDACTED';
const SERVICES = [
 'REDACTED
];
const COMMITS_ENDPOINT =
  'REDACTED';

// Helper Functions
// Helper function to get the first 6 characters of a commit sha.
const truncateCommitSha = (sha) => sha.slice(0, 7);

// Helper function to check if there's any version difference among services.
const hasVersionMismatch = (commits) => {
  if (!IS_PROD_ENV && commits) {
    const { REDACTED } = commits;
    return SERVICES.some((service) => commits[service] && commits[service] !== frontend);
  }
  return false;
};
// Helper function to construct the commit message when there's a version difference.
const formatVersionMismatchMessage = (commits) => {
  return Object.entries(commits)
    .filter(([service]) => SERVICES.includes(service))
    .map(([service, commit]) => `${service}: ${truncateCommitSha(commit)}`)
    .join('\n');
};

// Fetch commits from the endpoint.
const fetchCommitDetails = async () => {
  if (IS_PROD_ENV) return {};

  try {
    const response = await fetch(COMMITS_ENDPOINT);

    if (!response.ok) {
      throw new Error('Failed to fetch commits');
    }

    return response.json();
  } catch (error) {
    console.error('Network error:', error);
    throw new Error('Network error while fetching commits');
  }
};

const getCommitMessage = (commits) => {
  if (!commits || Object.keys(commits).length === 0) {
    return '';
  }

  if (hasVersionMismatch(commits)) {
    return formatVersionMismatchMessage(commits);
  }

  if (commits.frontend) {
    return truncateCommitSha(commits.frontend);
  }

  return '';
};

// Main Hook
export default function useCommitMessage() {
  const { data: commits, error } = useQuery(['commits'], fetchCommitDetails, {
    staleTime: Infinity, // ensures that the data is never considered stale and so it's never refetched after it initially loads
  });

  if (error) {
    console.error('Error fetching commits:', error);
    return 'Error fetching commit data';
  }

  return getCommitMessage(commits);
}
