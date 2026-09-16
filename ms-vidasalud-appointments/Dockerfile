FROM eclipse-temurin:21-jdk-jammy AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN apt-get update && apt-get install -y maven && mvn clean package -DskipTests

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8081
ENV JAVA_TOOL_OPTIONS="-Xms128m -Xmx256m"
ENTRYPOINT ["java", "-jar", "app.jar"]
