package cl.vidasalud.admin.dto;

public class ExchangeSummaryDto {

    private String name;
    private String type;
    private boolean durable;
    private boolean autoDelete;

    public ExchangeSummaryDto() {}

    public ExchangeSummaryDto(String name, String type, boolean durable, boolean autoDelete) {
        this.name = name;
        this.type = type;
        this.durable = durable;
        this.autoDelete = autoDelete;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public boolean isDurable() {
        return durable;
    }

    public void setDurable(boolean durable) {
        this.durable = durable;
    }

    public boolean isAutoDelete() {
        return autoDelete;
    }

    public void setAutoDelete(boolean autoDelete) {
        this.autoDelete = autoDelete;
    }
}
