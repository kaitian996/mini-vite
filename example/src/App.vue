<template>
    <div @click="change">
        {{ tag }}
    </div>
</template>
 
 
<script>
import { ref, reactive } from 'vue'
export default {
    setup() {
        const tag = ref(true)
        const change = () => {
            tag.value = !tag.value
        }
        return {
            tag, change
        }
    }
}
</script>
 
<style scoped>

</style>