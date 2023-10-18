import React from 'react'
import {ComponentPreview, Previews} from '@react-buddy/ide-toolbox'
import {PaletteTree} from './palette'
import HeroSection from "../components/Hero";

const ComponentPreviews = () => {
    return (
        <Previews palette={<PaletteTree/>}>
            <ComponentPreview path="/HeroSection">
                <HeroSection/>
            </ComponentPreview>
        </Previews>
    )
}

export default ComponentPreviews
