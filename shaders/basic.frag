#version 410 core

in vec3 fPosition;
in vec3 fNormal;
in vec2 fTexCoords;
in vec4 fragPosLightSpace;

out vec4 fColor;

//matrices
uniform mat4 model;
uniform mat4 view;
uniform mat3 normalMatrix;

//lighting
uniform vec3 lightDir;
uniform vec3 lightColor;

// textures
uniform sampler2D diffuseTexture;
uniform sampler2D specularTexture;
uniform sampler2D shadowMap;

//components
vec3 ambient;
float ambientStrength = 0.2f;
vec3 diffuse;
vec3 specular;
float specularStrength = 0.5f;
float constant = 1.0f;
float linear = 0.0045f;
float quadratic = 0.0075f;
float shininess = 32;

uniform bool fog;
float fogStrength = 0.03f;


void computeDirLight()
{
    //compute eye space coordinates
    vec4 fPosEye = view * model * vec4(fPosition, 1.0f);
    vec3 normalEye = normalize(normalMatrix * fNormal);

    //normalize light direction
    vec3 lightDirN = vec3(normalize(view * vec4(lightDir, 0.0f)));

    //compute view direction (in eye coordinates, the viewer is situated at the origin
    vec3 viewDir = normalize(- fPosition.xyz);

	//compute distance to light
	float dist = length(lightDir-fPosition.xyz);
	//compute attenuation
	//float att = 1.0f/(constant + linear*dist + quadratic*dist*dist);

    //compute ambient light
    ambient = ambientStrength * lightColor; //*att ;

    //compute diffuse light
    diffuse = max(dot(normalEye, lightDirN), 0.0f) * lightColor;

    //compute specular light
    vec3 reflectDir = reflect(-lightDirN, normalEye);
    float specCoeff = pow(max(dot(viewDir, reflectDir), 0.0f), 32);
    specular = specularStrength * specCoeff * lightColor;// * att;
}

float computeShadow()
{
	// perform perspective divide
	vec3 normalizedCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;

	// Transform to [0,1] range
	normalizedCoords = normalizedCoords * 0.5 + 0.5;

	//don't shadow values higher than 1in the depth map
	if (normalizedCoords.z > 1.0f)
		return 0.0f;


	// Get closest depth value from light's perspective
	float closestDepth = texture(shadowMap, normalizedCoords.xy).r;

	// Get depth of current fragment from light's perspective
	float currentDepth = normalizedCoords.z;

	// Check whether current frag pos is in shadow
	float bias = max(0.05f * (1.0f - dot(fNormal, lightDir)), 0.005f);
	float shadow = currentDepth - bias > closestDepth ? 1.0 : 0.0;

	return shadow;
}

float fogCompute(){
	float fragmentDistance = length(fPosition);
	float fogFactor = exp(-pow(fragmentDistance * fogStrength, 2));
	return clamp(fogFactor, 0.0f, 1.0f);

}

void main() 
{
    computeDirLight();

	//modulate with shadow
	float shadow = computeShadow();
    //compute final vertex color
    vec3 color = min((ambient + (1.0f - shadow)*diffuse) * texture(diffuseTexture, fTexCoords).rgb + (1.0f - shadow)*specular * texture(specularTexture, fTexCoords).rgb, 1.0f);
	
	vec4 fogColor = vec4(0.5f,0.5f,0.5f,1.0f);
	float fogFactor = fogCompute();
	
	if(fog == true){
		fColor = fogColor * (1- fogFactor) + vec4(color * fogFactor,1);
	}else{
		fColor = vec4(color, 1.0f);
	}

    
}
