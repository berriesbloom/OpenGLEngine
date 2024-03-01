#version 410 core

in vec2 fTexCoords;
out vec4 fColor;
uniform sampler2D textureSampler;

void main() 
{    
    //fColor = vec4(1.0f);
	fColor = texture(textureSampler, fTexCoords);
}
