// Create a context that imports all Vue files in the components folder
const requireComponent = import.meta.glob('./*.vue', {
    import: 'default',
    eager: true
})

const components: typeof requireComponent = {}

Object.entries(requireComponent).forEach(([path, component]) => {
    // Get component name from the file name
    const componentName = path.replace(/^\.\/(.*)\.\w+$/, '$1')

    // Add the component to the components object with its name as key
    components[componentName] = component
})

export default components
