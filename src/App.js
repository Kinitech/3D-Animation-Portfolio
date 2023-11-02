import './App.css';
import {useCallback, useRef, useState} from "react";
import Home from "./pages/Home";
import Neuro from "./pages/Neuro";
import BubblePage from "./components/Page";

const colors = [
    '(144, 207, 239',
    '(108, 189, 253',
    '(147, 111, 243',
    '(227, 151, 255'
];

function App() {
    const [page, setPage] = useState(1);
    const [color, setColor] = useState(null);
    const circleRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

    const handleFinishTransition = useCallback((i) => {
        setPage(i);
        setColor(colors[i - 2]);
        // Prevent scrolling
        document.body.style.overflow = 'hidden';
    }, [colors]);

    const handleBack = useCallback((i) => {
        circleRefs[i - 2].current.style.transform = 'scale(1)';
        circleRefs[i - 2].current.style.fontSize = '1em';
        setPage(1); // go back to home page
        // Allow scrolling
        document.body.style.overflow = 'auto';
    }, []);

    return (
        <div className="App">
            <Home colors={colors} page={page} onFinish={handleFinishTransition} circleRefs={circleRefs}/>
            {page !== 1 &&
                <BubblePage i={page} color={color} onBack={handleBack}>
                    {page === 2 && <div>Page 2</div>}
                    {page === 3 && <div>Page 3</div>}
                    {page === 4 && <div>Page 4</div>}
                    {page === 5 && <div>Page 5</div>}
                </BubblePage>
            }
        </div>
    );
}

export default App;
