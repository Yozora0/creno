# --- Build ---
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B package -DskipTests

# --- Run ---
# Image Ubuntu plutôt qu'Alpine : elle embarque l'archive CDS de base du JDK, nécessaire à l'étape d'optimisation.
FROM eclipse-temurin:21-jre
WORKDIR /app

# Réglages pour une petite machine (offres gratuites : 512 Mo, une fraction de processeur) :
# - tas Java adapté à la mémoire du conteneur ;
# - compilateur JIT rapide uniquement (C1) : moins de calcul au démarrage ;
# - ramasse-miettes série : pas de threads parallèles à se disputer un seul cœur.
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:TieredStopAtLevel=1 -XX:+UseSerialGC"

# Démarrage accéléré par CDS (Class Data Sharing) :
# 1. on éclate le jar (format recommandé par Spring Boot pour CDS) ;
# 2. on démarre l'application une fois pendant le build, sans base de données, juste le temps de charger
#    ses classes (spring.context.exit=onRefresh), et la JVM les enregistre dans app.jsa ;
# 3. au lancement réel, la JVM relit cette archive au lieu de recharger et vérifier chaque classe.
COPY --from=build /app/target/creno-backend.jar /tmp/creno.jar
RUN java -Djarmode=tools -jar /tmp/creno.jar extract --destination /app && rm /tmp/creno.jar \
 && java -XX:ArchiveClassesAtExit=app.jsa \
      -Dspring.context.exit=onRefresh \
      -Dspring.profiles.active=demo \
      -Dspring.flyway.enabled=false \
      -Dspring.jpa.hibernate.ddl-auto=none \
      -Dspring.jpa.properties.hibernate.boot.allow_jdbc_metadata_access=false \
      -Dspring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect \
      -Dspring.datasource.url=jdbc:postgresql://127.0.0.1:1/aucune-base-au-build \
      -jar creno.jar

RUN useradd --system --user-group app
USER app
EXPOSE 8080
ENTRYPOINT ["java", "-XX:SharedArchiveFile=app.jsa", "-jar", "creno.jar"]
