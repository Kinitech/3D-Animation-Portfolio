import './App.css';
import {useRef, useState} from "react";
import Home from "./pages/Home";
import BubblePage from "./components/Page";
import Neuro from "./pages/Neuro";
import ProjectsPage from "./pages/ProjectsPage";
import coding_projects from "./assets/coding_projects";
import ml_projects from "./assets/ml_projects";
import visualisation_projects from "./assets/visualisation_projects";

const colors = [
    '(144, 207, 239',
    '(54, 167, 255',
    '(147, 111, 243',
    '(227, 151, 255'
];

function App() {
    const [page, setPage] = useState(1);
    const [color, setColor] = useState(null);
    const circleRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

    const handleFinishTransition = ((i) => {
        setPage(i);
        setColor(colors[i - 2]);
        // Prevent scrolling
        document.body.style.overflow = 'hidden';
    });

    const handleBack = ((i) => {
        circleRefs[i - 2].current.style.transform = 'scale(1)';
        circleRefs[i - 2].current.style.fontSize = '1em';
        setPage(1); // go back to home page
        // Allow scrolling
        document.body.style.overflow = 'auto';
    });

    const disclaimer = "Most my work has been closed source, so I will be filling this up from now... (Nov 2023)!"
    return (
        <div className="App">
            <Home colors={colors} page={page} onFinish={handleFinishTransition} circleRefs={circleRefs}/>
            {page !== 1 &&
                <BubblePage i={page} color={color} onBack={handleBack}>
                    {page === 2 && <Neuro/>}
                    {page === 3 && <ProjectsPage
                        header='Full-stack projects'
                        title={disclaimer}
                        projects={coding_projects}
                        color={color}
                    />}
                    {page === 4 && <ProjectsPage
                        header='ML projects'
                        title={disclaimer}
                        projects={ml_projects}
                        color={color}
                    />}
                    {page === 5 && <ProjectsPage
                        header='Visualisation projects'
                        title={disclaimer}
                        projects={visualisation_projects}
                        color={color}
                    />}
                </BubblePage>
            }
        </div>
    );
}

export default App;
