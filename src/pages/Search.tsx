import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserAvatar } from '../components/common/UserAvatar';
import { wsService } from '../services/websocketService';
import type { ServerResponse } from '../services/websocketService';
import '../assets/Search.css';

type SearchStatus = 'idle' | 'loading' | 'found' | 'not-found' | 'error';

const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;
const REQUEST_TIMEOUT_MS = 10_000;

export default function Search() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [searchedUsername, setSearchedUsername] = useState('');
    const [status, setStatus] = useState<SearchStatus>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const searchController = useRef<AbortController | null>(null);

    useEffect(
        () => () => {
            searchController.current?.abort();
        },
        [],
    );

    const handleUsernameChange = (value: string) => {
        searchController.current?.abort();
        searchController.current = null;
        setUsername(value);
        setSearchedUsername('');
        setStatus('idle');
        setErrorMessage('');
    };

    const handleSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const query = username.trim();

        if (!query) {
            setSearchedUsername('');
            setStatus('error');
            setErrorMessage('Vui lòng nhập username cần tìm.');
            return;
        }

        if (!USERNAME_PATTERN.test(query)) {
            setSearchedUsername('');
            setStatus('error');
            setErrorMessage('Username chỉ được gồm chữ cái, chữ số và dấu gạch dưới.');
            return;
        }

        if (query.toLocaleLowerCase() === localStorage.getItem('username')?.toLocaleLowerCase()) {
            setSearchedUsername('');
            setStatus('error');
            setErrorMessage('Đây là username của bạn. Hãy nhập username của người khác.');
            return;
        }

        searchController.current?.abort();
        const controller = new AbortController();
        searchController.current = controller;
        setSearchedUsername(query);
        setStatus('loading');
        setErrorMessage('');

        try {
            wsService.connect();
        } catch {
            setStatus('error');
            setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng thử lại.');
            return;
        }

        let settled = false;
        let removeListener = () => {};
        const cleanup = () => {
            window.clearTimeout(timeout);
            removeListener();
            controller.signal.removeEventListener('abort', handleAbort);
        };
        const finish = (complete: () => void) => {
            if (settled) return;
            settled = true;
            cleanup();
            complete();
        };
        const handleAbort = () => finish(() => {});
        const timeout = window.setTimeout(() => {
            finish(() => {
                setStatus('error');
                setErrorMessage('Máy chủ không phản hồi. Vui lòng thử lại.');
            });
        }, REQUEST_TIMEOUT_MS);

        removeListener = wsService.addListener((response: ServerResponse) => {
            if (response.event !== 'CHECK_USER_EXIST' || controller.signal.aborted) return;

            if (response.status === 'error') {
                finish(() => {
                    setStatus('error');
                    setErrorMessage(response.mes || 'Không thể tìm username này.');
                });
                return;
            }

            const exists =
                typeof response.data === 'object' &&
                response.data !== null &&
                'status' in response.data &&
                typeof response.data.status === 'boolean'
                    ? response.data.status
                    : null;

            finish(() => {
                if (exists === null) {
                    setStatus('error');
                    setErrorMessage('Phản hồi tìm kiếm từ máy chủ không hợp lệ.');
                } else {
                    setStatus(exists ? 'found' : 'not-found');
                }
            });
        });

        controller.signal.addEventListener('abort', handleAbort, { once: true });
        wsService.onOpen(() => {
            if (!controller.signal.aborted) {
                wsService.sendMessage('CHECK_USER_EXIST', { user: query });
            }
        });
    };

    return (
        <main className="search-container">
            <section className="search-main">
                <h1 className="search-title">Tìm người dùng</h1>
                <p className="search-subtitle">
                    Nhập chính xác username để tìm và bắt đầu trò chuyện.
                </p>

                <form className="search-form" onSubmit={handleSearch}>
                    <div className="search-input-box">
                        <span className="search-input-icon" aria-hidden="true">
                            <i className="fa-solid fa-magnifying-glass"></i>
                        </span>
                        <input
                            type="text"
                            value={username}
                            onChange={(event) => handleUsernameChange(event.target.value)}
                            placeholder="Nhập username..."
                            className="search-input-field"
                            aria-label="Username cần tìm"
                            aria-invalid={status === 'error'}
                            autoComplete="off"
                        />
                    </div>
                    <button
                        type="submit"
                        className="search-submit-btn"
                        disabled={status === 'loading'}
                    >
                        {status === 'loading' ? 'Đang tìm...' : 'Tìm kiếm'}
                    </button>
                </form>

                <div className="search-results" aria-live="polite">
                    {status === 'loading' && (
                        <p className="search-status">Đang kiểm tra username...</p>
                    )}
                    {status === 'error' && (
                        <p className="search-feedback search-feedback-error" role="alert">
                            {errorMessage}
                        </p>
                    )}
                    {status === 'not-found' && (
                        <p className="search-feedback" role="status">
                            Không tìm thấy người dùng “{searchedUsername}”.
                        </p>
                    )}
                    {status === 'found' && (
                        <article className="search-user-result">
                            <UserAvatar name={searchedUsername} size="md" />
                            <div className="search-user-details">
                                <h2 className="search-user-name">{searchedUsername}</h2>
                                <p className="search-user-hint">
                                    Người dùng ChatApp
                                </p>
                            </div>
                            <button
                                type="button"
                                className="search-message-btn"
                                onClick={() =>
                                    navigate('/chat', { state: { chatWith: searchedUsername } })
                                }
                            >
                                <i className="fa-regular fa-comment-dots" aria-hidden="true"></i>
                                Nhắn tin
                            </button>
                        </article>
                    )}
                </div>

            </section>
        </main>
    );
}
